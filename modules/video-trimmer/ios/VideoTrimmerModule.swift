import AVFoundation
import ExpoModulesCore

public class VideoTrimmerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VideoTrimmer")

    AsyncFunction("trim") {
      (uri: String, startMs: Double, endMs: Double, outputPath: String, promise: Promise) in
      self.trim(uri: uri, startMs: startMs, endMs: endMs, outputPath: outputPath, promise: promise)
    }
  }

  private func trim(uri: String, startMs: Double, endMs: Double, outputPath: String, promise: Promise) {
    guard let srcURL = url(from: uri) else {
      promise.reject("ERR_TRIM_FAILED", "Invalid input URI: \(uri)")
      return
    }
    guard let outURL = url(from: outputPath) else {
      promise.reject("ERR_TRIM_FAILED", "Invalid output path: \(outputPath)")
      return
    }

    // MediaMuxer on Android overwrites; mirror that by clearing any stale file.
    try? FileManager.default.removeItem(at: outURL)

    let asset = AVURLAsset(url: srcURL)
    // Passthrough = stream copy, no re-encode (matches the Android path).
    guard let export = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetPassthrough) else {
      promise.reject("ERR_TRIM_FAILED", "Could not create export session")
      return
    }

    export.outputURL = outURL
    export.outputFileType = .mp4
    let start = CMTime(value: Int64(startMs), timescale: 1000)
    let end = CMTime(value: Int64(endMs), timescale: 1000)
    export.timeRange = CMTimeRange(start: start, end: end)

    export.exportAsynchronously {
      switch export.status {
      case .completed:
        promise.resolve(outURL.absoluteString)
      case .cancelled:
        promise.reject("ERR_TRIM_FAILED", "Trim was cancelled")
      default:
        let message = export.error?.localizedDescription ?? "Unknown export error"
        promise.reject("ERR_TRIM_FAILED", "Failed to trim video: \(message)")
      }
    }
  }

  private func url(from value: String) -> URL? {
    if value.hasPrefix("file://") || value.hasPrefix("content://") {
      return URL(string: value)
    }
    return URL(fileURLWithPath: value)
  }
}
