import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { getFrameAt } from "react-native-video-trim";

const HANDLE_W = 2; // visual width of the thin handle line
const HIT_W = 36; // width of the invisible touch target around each handle
const TRACK_H = 56;
const FRAME_COUNT = 6;
// Don't let the selectable window collapse to nothing.
const MIN_DURATION_MS = 1000;

const toFileUri = (path: string): string =>
  path.startsWith("file://") || path.startsWith("content://")
    ? path
    : `file://${path}`;

const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export interface TrimRange {
  startMs: number;
  endMs: number;
}

/**
 * A filmstrip-backed dual-handle range slider for picking a from/to window of a
 * video. Purely measures the range — actual trimming happens elsewhere. The
 * window is capped at `maxDurationMs`. Keyed by uri so it remounts (and resets
 * its handles) whenever the previewed video changes.
 */
const VideoTrimmer = ({
  uri,
  durationMs,
  maxDurationMs,
  initialRange,
  onChange,
  onScrub,
}: {
  uri: string;
  durationMs: number;
  maxDurationMs: number;
  initialRange: TrimRange;
  onChange: (range: TrimRange) => void;
  onScrub?: (ms: number) => void;
}) => {
  const [frames, setFrames] = useState<string[]>([]);
  const [labels, setLabels] = useState<TrimRange>(initialRange);

  // Handle positions in px within the measured track. Config values are shared
  // so the gesture worklets can read them without crossing the JS boundary.
  const startX = useSharedValue(0);
  const endX = useSharedValue(0);
  const dragCtx = useSharedValue(0);
  const pxPerMs = useSharedValue(0);
  const trackW = useSharedValue(0);
  const minGapPx = useSharedValue(0);
  const maxGapPx = useSharedValue(0);

  // Pull a handful of evenly-spaced frames for the strip background.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const times = Array.from({ length: FRAME_COUNT }, (_, i) =>
        Math.floor((durationMs / FRAME_COUNT) * (i + 0.5)),
      );
      console.log(
        `[VideoTrimmer] extracting ${FRAME_COUNT} frames from`,
        uri,
        `(duration=${durationMs}ms)`,
      );
      const results = await Promise.all(
        times.map((time) =>
          getFrameAt(uri, { time, quality: 50, maxWidth: 120, maxHeight: 120 })
            .then((r) => toFileUri(r.outputPath))
            .catch((err) => {
              console.warn(`[VideoTrimmer] frame at ${time}ms failed`, err);
              return null;
            }),
        ),
      );
      const frameUris = results.filter((r): r is string => !!r);
      console.log(`[VideoTrimmer] extracted ${frameUris.length} frame(s)`);
      if (!cancelled) setFrames(frameUris);
    })();
    return () => {
      cancelled = true;
    };
  }, [uri, durationMs]);

  const onLayout = (width: number) => {
    if (!width || !durationMs) return;
    const ppm = width / durationMs;
    pxPerMs.value = ppm;
    trackW.value = width;
    minGapPx.value = Math.max(MIN_DURATION_MS * ppm, HANDLE_W * 2);
    maxGapPx.value = maxDurationMs * ppm;
    startX.value = initialRange.startMs * ppm;
    endX.value = Math.min(initialRange.endMs * ppm, width);
  };

  const emit = (sMs: number, eMs: number) =>
    onChange({ startMs: sMs, endMs: eMs });

  // Keep the on-screen time labels in sync with the handles as they move.
  useAnimatedReaction(
    () => ({ s: startX.value, e: endX.value, ppm: pxPerMs.value }),
    (cur) => {
      if (!cur.ppm) return;
      runOnJS(setLabels)({ startMs: cur.s / cur.ppm, endMs: cur.e / cur.ppm });
    },
  );

  const startGesture = Gesture.Pan()
    .onStart(() => {
      dragCtx.value = startX.value;
    })
    .onUpdate((e) => {
      let nx = dragCtx.value + e.translationX;
      const upper = endX.value - minGapPx.value;
      const lower = Math.max(0, endX.value - maxGapPx.value);
      nx = Math.min(Math.max(nx, lower), upper);
      startX.value = nx;
      if (onScrub && pxPerMs.value) runOnJS(onScrub)(nx / pxPerMs.value);
    })
    .onEnd(() => {
      if (pxPerMs.value)
        runOnJS(emit)(startX.value / pxPerMs.value, endX.value / pxPerMs.value);
    });

  const endGesture = Gesture.Pan()
    .onStart(() => {
      dragCtx.value = endX.value;
    })
    .onUpdate((e) => {
      let nx = dragCtx.value + e.translationX;
      const lower = startX.value + minGapPx.value;
      const upper = Math.min(trackW.value, startX.value + maxGapPx.value);
      nx = Math.min(Math.max(nx, lower), upper);
      endX.value = nx;
      if (onScrub && pxPerMs.value) runOnJS(onScrub)(nx / pxPerMs.value);
    })
    .onEnd(() => {
      if (pxPerMs.value)
        runOnJS(emit)(startX.value / pxPerMs.value, endX.value / pxPerMs.value);
    });

  // Drag the whole selected window without changing its length.
  const windowGesture = Gesture.Pan()
    .onStart(() => {
      dragCtx.value = startX.value;
    })
    .onUpdate((e) => {
      const len = endX.value - startX.value;
      let ns = dragCtx.value + e.translationX;
      ns = Math.min(Math.max(ns, 0), trackW.value - len);
      startX.value = ns;
      endX.value = ns + len;
    })
    .onEnd(() => {
      if (pxPerMs.value)
        runOnJS(emit)(startX.value / pxPerMs.value, endX.value / pxPerMs.value);
    });

  const selectionStyle = useAnimatedStyle(() => ({
    left: startX.value,
    width: Math.max(0, endX.value - startX.value),
  }));
  // Center the wide (transparent) grab area on each boundary line.
  const startHandleStyle = useAnimatedStyle(() => ({
    left: startX.value - HIT_W / 2,
  }));
  const endHandleStyle = useAnimatedStyle(() => ({
    left: endX.value - HIT_W / 2,
  }));
  const leftDimStyle = useAnimatedStyle(() => ({ width: startX.value }));
  const rightDimStyle = useAnimatedStyle(() => ({ left: endX.value }));

  return (
    <View className="bg-black/50 rounded-2xl p-3 px-2">
      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-white text-xs font-semibold">
          {formatTime(labels.startMs)}
        </Text>
        <Text className="text-white/70 text-xs">
          {formatTime(labels.endMs - labels.startMs)} selected
        </Text>
        <Text className="text-white text-xs font-semibold">
          {formatTime(labels.endMs)}
        </Text>
      </View>

      <View
        onLayout={(e) => onLayout(e.nativeEvent.layout.width)}
        style={{ height: TRACK_H }}
        className="bg-black/40 relative"
      >
        {/* filmstrip background */}
        <View className="absolute inset-0 flex-row overflow-hidden">
          {frames.map((f, i) => (
            <Image
              key={i}
              source={{ uri: f }}
              className="flex-1 h-full"
              resizeMode="cover"
            />
          ))}
        </View>

        {/* dim the parts outside the selection */}
        <Animated.View
          style={leftDimStyle}
          className="absolute top-0 bottom-0 left-0 bg-black/60"
        />
        <Animated.View
          style={rightDimStyle}
          className="absolute top-0 bottom-0 right-0 bg-black/60"
        />

        {/* selected window: top/bottom border + draggable region */}
        <Animated.View
          style={selectionStyle}
          className="absolute top-0 bottom-0 border-y-2 border-gradientFirst"
        >
          <GestureDetector gesture={windowGesture}>
            <View className="flex-1" />
          </GestureDetector>
        </Animated.View>

        {/* from handle: wide transparent grab area, thin line + dot centered */}
        <GestureDetector gesture={startGesture}>
          <Animated.View
            style={[startHandleStyle, { width: HIT_W }]}
            className="absolute top-0 bottom-0 items-center justify-center"
          >
            <View
              style={{ width: HANDLE_W, left: (HIT_W - HANDLE_W) / 2 }}
              className="absolute top-0 bottom-0 bg-gradientFirst"
            />
            <View className="h-4 w-4 bg-gradientFirst rounded-full" />
          </Animated.View>
        </GestureDetector>

        {/* to handle: wide transparent grab area, thin line + dot centered */}
        <GestureDetector gesture={endGesture}>
          <Animated.View
            style={[endHandleStyle, { width: HIT_W }]}
            className="absolute top-0 bottom-0 items-center justify-center"
          >
            <View
              style={{ width: HANDLE_W, left: (HIT_W - HANDLE_W) / 2 }}
              className="absolute top-0 bottom-0 bg-gradientFirst"
            />
            <View className="h-4 w-4 bg-gradientFirst rounded-full" />
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

export default VideoTrimmer;
