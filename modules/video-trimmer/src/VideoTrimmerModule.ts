import { NativeModule, requireNativeModule } from "expo";

declare class VideoTrimmerModule extends NativeModule {
  /**
   * Trims the video at `uri` to the [startMs, endMs] window and writes it to
   * `outputPath`. Uses stream copy (no re-encode) on both platforms, so cuts
   * land on the nearest preceding keyframe. Resolves with the output file URI.
   */
  trim(
    uri: string,
    startMs: number,
    endMs: number,
    outputPath: string,
  ): Promise<string>;

  /**
   * Extracts a single frame near `timeMs` (snapped to the closest keyframe) as
   * a JPEG, scaled to fit within `maxSize`x`maxSize` px. Resolves with the
   * output image's file URI.
   */
  getFrameAt(uri: string, timeMs: number, maxSize: number): Promise<string>;
}

export default requireNativeModule<VideoTrimmerModule>("VideoTrimmer");
