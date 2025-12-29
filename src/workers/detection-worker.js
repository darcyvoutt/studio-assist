import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js'
import Essentia from 'essentia.js/dist/essentia.js-core.es.min.js'

const essentia = new Essentia(EssentiaWASM)

self.onmessage = (event) => {
  const buffer = event.data.audioBuffer
  const configs = event.data.configs
  const result = {
    duration: null,
    keyData: null,
    measures: {
      LUFS: null,
    },
    sampleRate: null,
    success: true,
    tempo: null,
    tuning: configs.tuning,
  }

  // Update sample rate & duration
  result.sampleRate = buffer.sampleRate
  result.duration = new Date(buffer.duration * 1000)
    .toISOString()
    .substring(14, 19)

  // Convert the JS float32 typed array into std::vector<float>
  const signalVectorLeft = essentia.arrayToVector(buffer.channelsData[0])

  // TuningFrequency: https://essentia.upf.edu/reference/std_TuningFrequency.html
  if (configs.autoTuning !== undefined && configs.autoTuning) {
    const tuningExtract = essentia.TuningFrequency(
      signalVectorLeft,
      signalVectorLeft
    )
    result.tuning = Math.round(tuningExtract.tuningFrequency)
  }

  // KeyExtractor: https://essentia.upf.edu/reference/std_KeyExtractor.html
  result.keyData = essentia.KeyExtractor(
    signalVectorLeft, // mono audio signal
    true, // averageDetuningCorrection
    4096, // frameSize
    4096, // hopSize
    12, // hpcpSize
    configs.maxFreq, // maxFrequency
    60, // maximumSpectralPeaks
    configs.minFreq, // minFrequency
    0.2, // pcpThreshold
    configs.profile, // profileType
    result.sampleRate, // sampleRate
    0.0001, // spectralPeaksThreshold
    result.tuning, // spectralPeaksThreshold
    'squaredCosine', // weightType
    'hann' // windowType
  )

  // Tempo: https://essentia.upf.edu/reference/std_PercivalBpmEstimator.html
  result.tempo = essentia.PercivalBpmEstimator(
    signalVectorLeft,
    1024,
    2048,
    128,
    128,
    210,
    50,
    result.sampleRate
  ).bpm

  // If stereo file
  if (buffer.channels === 2) {
    const signalVectorRight = essentia.arrayToVector(buffer.channelsData[1])

    // Loudness: https://essentia.upf.edu/reference/std_LoudnessEBUR128.html
    result.measures.LUFS = essentia.LoudnessEBUR128(
      signalVectorLeft,
      signalVectorRight,
      0.1,
      result.sampleRate,
      false
    ).integratedLoudness
  }

  // Return
  self.postMessage(result)

  essentia.shutdown()
  essentia.delete()
}
