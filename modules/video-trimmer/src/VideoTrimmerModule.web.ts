import { registerWebModule, NativeModule } from "expo";

// Video trimming is not supported on web.
class VideoTrimmerModule extends NativeModule {
  async trim(): Promise<string> {
    throw new Error("VideoTrimmer is not available on web");
  }
}

export default registerWebModule(VideoTrimmerModule, "VideoTrimmerModule");
