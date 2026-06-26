import AVFoundation
import ExpoModulesCore
import UIKit

public class VideoTrimmerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VideoTrimmer")

    AsyncFunction("trim") {
      (uri: String, startMs: Double, endMs: Double, outputPath: String, promise: Promise) in
      self.trim(uri: uri, startMs: startMs, endMs: endMs, outputPath: outputPath, promise: promise)
    }

    AsyncFunction("getFrameAt") {
      (uri: String, timeMs: Double, maxSize: Double, promise: Promise) in
      self.getFrameAt(uri: uri, timeMs: timeMs, maxSize: maxSize, promise: promise)
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

  private func getFrameAt(uri: String, timeMs: Double, maxSize: Double, promise: Promise) {
    guard let srcURL = url(from: uri) else {
      promise.reject("ERR_FRAME_FAILED", "Invalid input URI: \(uri)")
      return
    }

    let asset = AVURLAsset(url: srcURL)
    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    if maxSize > 0 {
      generator.maximumSize = CGSize(width: maxSize, height: maxSize)
    }
    // Loose tolerance → snaps to the nearest keyframe, which is fast.
    generator.requestedTimeToleranceBefore = .positiveInfinity
    generator.requestedTimeToleranceAfter = .positiveInfinity

    let time = CMTime(value: Int64(timeMs), timescale: 1000)
    generator.generateCGImagesAsynchronously(forTimes: [NSValue(time: time)]) {
      _, cgImage, _, result, error in
      guard result == .succeeded, let cgImage = cgImage else {
        promise.reject("ERR_FRAME_FAILED", error?.localizedDescription ?? "No frame")
        return
      }
      guard let data = UIImage(cgImage: cgImage).jpegData(compressionQuality: 0.7) else {
        promise.reject("ERR_FRAME_FAILED", "Could not encode frame")
        return
      }
      let name = "vt_frame_\(abs(uri.hashValue))_\(Int(timeMs)).jpg"
      let outURL = FileManager.default.temporaryDirectory.appendingPathComponent(name)
      do {
        try data.write(to: outURL, options: .atomic)
        promise.resolve(outURL.absoluteString)
      } catch {
        promise.reject("ERR_FRAME_FAILED", "Could not write frame: \(error.localizedDescription)")
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
