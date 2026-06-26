package expo.modules.videotrimmer

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer

class VideoTrimmerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VideoTrimmer")

    // Both run off the main thread, so the blocking native work is safe here.
    AsyncFunction("trim") { uri: String, startMs: Double, endMs: Double, outputPath: String ->
      trim(uri, startMs.toLong(), endMs.toLong(), outputPath)
    }

    AsyncFunction("getFrameAt") { uri: String, timeMs: Double, maxSize: Int ->
      getFrameAt(uri, timeMs.toLong(), maxSize)
    }
  }

  private fun trim(uri: String, startMs: Long, endMs: Long, outputPath: String): String {
    val outPath = if (outputPath.startsWith("file://")) Uri.parse(outputPath).path!! else outputPath
    val outFile = File(outPath)
    if (outFile.exists()) outFile.delete()

    val extractor = MediaExtractor()
    var muxer: MediaMuxer? = null
    try {
      setExtractorSource(extractor, uri)

      // Map every source track into the muxer.
      val trackCount = extractor.trackCount
      val indexMap = HashMap<Int, Int>(trackCount)
      var maxInputSize = 1 * 1024 * 1024
      muxer = MediaMuxer(outPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      for (i in 0 until trackCount) {
        extractor.selectTrack(i)
        val format = extractor.getTrackFormat(i)
        if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
          maxInputSize = maxOf(maxInputSize, format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE))
        }
        indexMap[i] = muxer.addTrack(format)
      }

      // Preserve display rotation so portrait clips aren't written sideways.
      rotationOf(uri)?.let { muxer.setOrientationHint(it) }

      val startUs = startMs * 1000
      val endUs = endMs * 1000
      extractor.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)

      muxer.start()
      val buffer = ByteBuffer.allocate(maxInputSize)
      val info = MediaCodec.BufferInfo()
      // Rebase timestamps so the output starts at 0 (single offset keeps A/V in sync).
      var ptsOffsetUs = -1L

      while (true) {
        info.offset = 0
        info.size = extractor.readSampleData(buffer, 0)
        if (info.size < 0) break

        val sampleTimeUs = extractor.sampleTime
        if (sampleTimeUs > endUs) break

        if (ptsOffsetUs < 0) ptsOffsetUs = sampleTimeUs
        info.presentationTimeUs = sampleTimeUs - ptsOffsetUs
        info.flags = if (extractor.sampleFlags and MediaExtractor.SAMPLE_FLAG_SYNC != 0) {
          MediaCodec.BUFFER_FLAG_KEY_FRAME
        } else {
          0
        }

        val dstTrack = indexMap[extractor.sampleTrackIndex] ?: continue
        muxer.writeSampleData(dstTrack, buffer, info)
        extractor.advance()
      }

      return "file://$outPath"
    } catch (e: CodedException) {
      throw e
    } catch (e: Exception) {
      if (outFile.exists()) outFile.delete()
      throw CodedException("ERR_TRIM_FAILED", "Failed to trim video: ${e.message}", e)
    } finally {
      try {
        muxer?.stop()
      } catch (_: Exception) {
      }
      try {
        muxer?.release()
      } catch (_: Exception) {
      }
      extractor.release()
    }
  }

  // Extracts a single frame near `timeMs` as a JPEG in the cache and returns its
  // file URI. Snaps to the closest sync frame, so it's fast (no decode loop).
  private fun getFrameAt(uri: String, timeMs: Long, maxSize: Int): String {
    val context = appContext.reactContext
      ?: throw CodedException("ERR_FRAME_FAILED", "No app context", null)
    val retriever = MediaMetadataRetriever()
    try {
      applyRetrieverSource(retriever, context, uri)
      val timeUs = timeMs * 1000
      val bitmap: Bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1 && maxSize > 0) {
        retriever.getScaledFrameAtTime(
          timeUs,
          MediaMetadataRetriever.OPTION_CLOSEST_SYNC,
          maxSize,
          maxSize,
        )
      } else {
        retriever.getFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
      } ?: throw CodedException("ERR_FRAME_FAILED", "No frame at $timeMs ms", null)

      val outFile = File(context.cacheDir, "vt_frame_${uri.hashCode()}_$timeMs.jpg")
      FileOutputStream(outFile).use { out ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 70, out)
      }
      bitmap.recycle()
      return "file://${outFile.absolutePath}"
    } catch (e: CodedException) {
      throw e
    } catch (e: Exception) {
      throw CodedException("ERR_FRAME_FAILED", "Failed to extract frame: ${e.message}", e)
    } finally {
      try {
        retriever.release()
      } catch (_: Exception) {
      }
    }
  }

  private fun setExtractorSource(extractor: MediaExtractor, uri: String) {
    val context = appContext.reactContext
    when {
      uri.startsWith("content://") && context != null -> {
        context.contentResolver.openFileDescriptor(Uri.parse(uri), "r").use { pfd ->
          extractor.setDataSource(pfd!!.fileDescriptor)
        }
      }
      uri.startsWith("file://") -> extractor.setDataSource(Uri.parse(uri).path!!)
      else -> extractor.setDataSource(uri)
    }
  }

  private fun applyRetrieverSource(
    retriever: MediaMetadataRetriever,
    context: Context,
    uri: String,
  ) {
    when {
      uri.startsWith("content://") -> retriever.setDataSource(context, Uri.parse(uri))
      uri.startsWith("file://") -> retriever.setDataSource(Uri.parse(uri).path)
      else -> retriever.setDataSource(uri)
    }
  }

  private fun rotationOf(uri: String): Int? {
    val context = appContext.reactContext ?: return null
    val retriever = MediaMetadataRetriever()
    return try {
      applyRetrieverSource(retriever, context, uri)
      retriever
        .extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
        ?.toIntOrNull()
    } catch (_: Exception) {
      null
    } finally {
      try {
        retriever.release()
      } catch (_: Exception) {
      }
    }
  }
}
