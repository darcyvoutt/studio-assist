// Utilities
import DetectionWork from '@/workers/detection-worker?worker'
import { getAudioBuffer } from '@/utils/buffer'
import { locale } from '@/utils/locale'

const response = async (worker, logData) => {
  const messagePromise = new Promise((resolve, reject) => {
    worker.onmessage = (event) => resolve(event.data)
    worker.onerror = (error) => reject(error)
  })

  try {
    const result = await messagePromise
    return result
  } catch (error) {
    console.error(`Unable to process file: ${error.message}. Data: ${JSON.stringify(logData)}`)
    return {
      success: false,
      error: locale('files.errors.detection'),
    }
  }
}

export const worker = async ({ audioUrl, configs, file }) => {
  const worker = new DetectionWork()
  const audioBuffer = await getAudioBuffer({ filePath: audioUrl })

  // Send a message to the worker
  worker.postMessage({ audioBuffer, configs })

  // Listen for messages from the worker
  return await response(worker, { audioUrl, configs, file })
}
