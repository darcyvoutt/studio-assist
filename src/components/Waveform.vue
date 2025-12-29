<script setup>
import WaveSurfer from 'wavesurfer.js'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { exportBuffer, measureAudio } from '@/utils/buffer'
import { timeString, trimDecimals } from '@/utils/convert'
import { fileName, fileType } from '@/utils/files'
import Loading from '@/icons/Loading.vue'

// Props
const props = defineProps({
  file: Object,
  fileId: String,
  gainAmount: {
    type: Number,
    default: 0,
  },
  muted: Boolean,
  src: String,
})

// Refs
const analyser = ref(null)
const buffer = ref({})
const duration = ref('00:00')
const id = ref(`wave${props.fileId}`)
const loading = ref(false)
const ready = ref(false)
const time = ref('00:00.0')
const waves = ref(null)

// Export custom emit
const emit = defineEmits([
  'paused',
  'playing',
  'rebuilding',
  'rebuilt',
  'seeked',
])

// Computed
const audioSrc = computed(() => props.src)
const gainAmount = computed(() => props.gainAmount)

// Watchers
watch(audioSrc, () => {
  stop()
  waves.value.load(props.src)
})
watch(gainAmount, () => gainSetAmount())

// Lifecycle
onMounted(() => init())
onUnmounted(() => waves.value.destroy())

// Initializer Methods
const init = () => {
  // Setup
  loading.value = true

  // Create Wavesurfer
  waves.value = WaveSurfer.create({
    backend: 'WebAudio',
    barGap: 1,
    barWidth: 2,
    container: `#${id.value}`,
    fillParent: true,
    interact: false,
    progressColor: '#857371',
    sampleRate: buffer.value.sampleRate,
    waveColor: '#eb4444',
    url: props.src,
  })

  setupAnalyzer()

  // Wavesurfer events
  waves.value.on('interaction', (num) => emit('seeked', num))
  waves.value.on('load', () => (ready.value = false))
  waves.value.on('pause', () => emit('paused'))
  waves.value.on('play', () => emit('playing'))
  waves.value.on('ready', async () => onReady())
  waves.value.on('timeupdate', (num) => (time.value = timeString(num, true)))

  // Stop Loading
  loading.value = false
}
const onReady = () => {
  // Update states
  loading.value = true
  ready.value = false

  // Update properties
  duration.value = timeString(waves.value.getDuration())
  mute(props.muted)
  emit('rebuilt')

  // Update states
  ready.value = true
  loading.value = false
}

// General Methods
const analyze = async () => {
  if (waves.value.getDecodedData() === null) return
  buffer.value = exportBuffer({ audioBuffer: waves.value.getDecodedData() })
  return await measureAudio({ fileBuffer: buffer.value, channels: 1 })
}
const setupAnalyzer = () => {
  try {
    const source = waves.value.getMediaElement()
    const audioCxt = waves.value.getMediaElement().audioContext

    // Create analyzer
    if (analyser.value === null) {
      analyser.value = audioCxt.createAnalyser()
      analyser.value.fftSize = 1024
    }

    // Connect context to analyzer
    source.gainNode.connect(analyser.value)
    analyser.value.connect(audioCxt.destination)
  } catch (error) {
    console.error(error.message)
  }
}
const gainSetAmount = () => {
  waves.value.setVolume(isMute() ? 0 : props.gainAmount)
}
const getPeak = () => {
  // Setup analyser
  const dataArray = new Float32Array(analyser.value.fftSize)
  analyser.value.getFloatTimeDomainData(dataArray)

  // Find peak amplitude in the current frame
  let amplitude = 0
  for (let i = 0; i < dataArray.length; i++) {
    amplitude = Math.max(amplitude, Math.abs(dataArray[i]))
  }

  // Convert peak amplitude to dBFS
  const dBFS = 20 * Math.log10(amplitude)

  // Handle -Infinity case for silent audio
  return isFinite(dBFS) ? trimDecimals(dBFS, 1, false) : -100
}
const getTime = () => parseFloat(waves.value.getCurrentTime())
const filename = (name) => fileName(name)
const filetype = (type) => fileType(type)
const isMute = () => waves.value.getMuted()
const mute = (muted) => {
  waves.value.setMuted(muted)
  gainSetAmount()
}
const play = () => {
  waves.value.playPause()
}
const reset = () => {
  emit('rebuilding')
  stop()
  waves.value.load(props.src)
}
const setInteract = (boolean = true) => waves.value.toggleInteraction(boolean)
const setTime = (number) => waves.value.setTime(number)
const skipTime = (increment) => {
  const currenTime = waves.value.getCurrentTime()
  waves.value.setTime(currenTime + increment)
}
const stop = () => waves.value.stop()

// Expose for parent
defineExpose({
  analyze,
  getPeak,
  getTime,
  isMute,
  mute,
  play,
  reset,
  setupAnalyzer,
  setInteract,
  setTime,
  skipTime,
  stop,
})
</script>

<template>
  <div class="relative h-32">
    <!-- Loading -->
    <Loading
      v-if="loading"
      :showText="false"
      class="h-full w-full flex items-center justify-center"
    />

    <div
      class="flex items-center gap-1.5 absolute right-0 z-10 opacity-80 top-1"
    >
      <!-- Timestamp -->
      <div
        v-if="ready"
        class="flex items-center gap-1.5 px-1 rounded-md text-sm bg-neutral-50 dark:bg-surface-variant border border-neutral-200 dark:border-transparent cursor-default"
      >
        <span>{{ filename(file.name) }}</span>
        <span>•</span>
        <span class="tabular-nums">{{ time }} / {{ duration }}</span>
      </div>

      <span class="pill-tertiary pill-xs">
        {{ filetype(file.type) }}
      </span>
    </div>

    <!-- Waveform -->
    <div :id="id" class="waveform" :class="{ hidden: loading }"></div>
  </div>
</template>
