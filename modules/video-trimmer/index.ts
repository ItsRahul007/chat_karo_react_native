import VideoTrimmer from "./src/VideoTrimmerModule";

/**
 * Trims the video at `inputUri` to the [`startMs`, `endMs`] window (in
 * milliseconds) and writes it to `outputPath` (a `file://` URI or absolute
 * path). Stream copy only — no re-encode — so the cut snaps to the nearest
 * preceding keyframe, matching ffmpeg's `-c copy` behaviour.
 *
 * @returns the output file's `file://` URI.
 */
export function trimVideo(
  inputUri: string,
  startMs: number,
  endMs: number,
  outputPath: string,
): Promise<string> {
  return VideoTrimmer.trim(
    inputUri,
    Math.round(startMs),
    Math.round(endMs),
    outputPath,
  );
}
