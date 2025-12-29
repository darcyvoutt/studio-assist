/**
 * calcAudio - Calculates audio measurements
 *
 * @param {ArrayBuffer} channel - Float 32 array of audio channel data
 * @param {Integer} sampleRate - The sample rate of the audio
 * @returns {Object}
 */
const calcAudio = ({ channel, sampleRate }) => {
  // Define the window size based on the sample rate (e.g., 1 second)
  const windowSize = sampleRate

  // Initialize variables for RMS calculation
  let sumSquares = 0
  let windowCount = 0

  // Calculate RMS over multiple windows
  for (let start = 0; start < channel.length; start += windowSize) {
    let end = Math.min(start + windowSize, channel.length)
    let windowSumSquares = 0

    for (let i = start; i < end; i++) {
      windowSumSquares += channel[i] * channel[i]
    }

    sumSquares += windowSumSquares / (end - start)
    windowCount++
  }

  // Calculate the average RMS over all windows
  let RMS = Math.sqrt(sumSquares / windowCount)

  // Convert RMS to Loudness in dBfs
  RMS = 20 * Math.log10(RMS)

  // Handle -Infinity and NaN cases
  RMS = RMS === -Infinity || isNaN(RMS) ? -Infinity : RMS

  return {
    RMS,
  }
}

/**
 * exportBuffer - Export audio buffer data in object format
 *
 * @param {String} filePath - Location of the audio file
 * @param {AudioContext} context - The AudioContext object
 * @returns {Object}
 */
export const exportBuffer = ({ audioBuffer }) => {
  // Get channel data
  let channels = []
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i))
  }

  return {
    channels: audioBuffer.numberOfChannels,
    channelsData: channels,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  }
}

/**
 * getAudioBuffer - Gets the audio buffer and returns object
 *
 * @param {String} filePath - Location of the audio file
 * @param {AudioContext} context - The AudioContext object
 * @returns {Object}
 */
export const getAudioBuffer = async ({ filePath, context = null }) => {
  // Create temporary audio context if null
  let audioContext = context
  if (context === null) audioContext = new AudioContext()

  // Get data
  const response = await fetch(filePath)
  const arrayBuffer = await response.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // Get channel data
  let channels = []
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i))
  }

  // Close temporary audio context
  if (context === null) audioContext.close()

  return {
    channels: audioBuffer.numberOfChannels,
    channelsData: channels,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  }
}

/**
 * measureAudio - Process of measuring audio data
 *
 * @param {Integer} channels - Number of audio channels to measure
 * @param {Buffer} fileBuffer - The audio buffer
 * @param {String} filePath - To be set if fileBuffer is not set
 * @returns {Object}
 */
export const measureAudio = async ({
  channels = 1,
  fileBuffer = {},
  filePath = '',
}) => {
  let buffer = {}

  if (Object.keys(fileBuffer).length === 0)
    buffer = await getAudioBuffer({ filePath })
  else buffer = fileBuffer

  const result = { channel0: null, channel1: null, avg: null }

  // Mono analysis
  result.channel0 = calcAudio({
    channel: buffer.channelsData[0],
    sampleRate: buffer.sampleRate,
  })

  result.avg = { RMS: result.channel0.RMS, sampleRate: buffer.sampleRate }

  // If analyzing in stereo
  if (buffer.channels === 2 && channels === 2) {
    result.channel1 = calcAudio({
      channel: buffer.channelsData[1],
      sampleRate: buffer.sampleRate,
    })
    result.avg.RMS = (result.channel0.RMS + result.channel1.RMS) / channels
  }

  return result
}
