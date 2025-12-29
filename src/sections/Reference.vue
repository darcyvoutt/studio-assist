<script setup>
// Modules
import { useStore } from 'vuex'
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { message } from '@tauri-apps/api/dialog'
import { listen } from '@tauri-apps/api/event'

// Wavesurfer
import MultiTrack from 'wavesurfer-multitrack'
import WebAudioPlayer from 'node_modules/wavesurfer-multitrack/dist/webaudio.js'

// Utilities
import { getAudioBuffer, measureAudio } from '@/utils/buffer'
import { timeString, trimDecimals } from '@/utils/convert'
import { fileName, fileType } from '@/utils/files'
import { encode } from '@/utils/encoding'
import { locale } from '@/utils/locale'

// Components
import Shortcut from '@/components/Shortcut.vue'

// Icons
import ArrowsUpDown from '@/icons/ArrowsUpDown.vue'
import DocumentAdd from '@/icons/DocumentAdd.vue'
import SpeakerMute from '@/icons/SpeakerMute.vue'
import CheckCircle from '@/icons/CheckCircle.vue'
import PlayPause from '@/icons/PlayPause.vue'
import XCircle from '@/icons/XCircle.vue'
import Loading from '@/icons/Loading.vue'
import Speaker from '@/icons/Speaker.vue'
import Pause from '@/icons/Pause.vue'
import Stop from '@/icons/Stop.vue'
import Info from '@/icons/Info.vue'

// Structure
const audioCtx = new AudioContext()
const fileStruct = {
  id: null,
  index: 0,
  name: null,
  name_split: null,
  measures: null,
  type: null,
  url: null,
}
let multitrack = null
const trialPlayback = 45

// Store
const store = useStore()

// Refs
const active = ref(0)
const analyser = ref(null)
const container = ref(0)
const fileA = ref(null)
const fileB = ref(null)
const files = reactive({
  a: { ...fileStruct },
  b: { ...fileStruct },
})
const fileKey = ref(null)
const filesReady = ref(false)
const gainMatch = ref(true)
const loaded = ref(false)
const meter = ref(0)
const muted = ref(false)
const paused = ref(false)
const peaksArray = ref([])
const peaksPositionsArray = ref([])
const peakClip = ref(null)
const peakDBFS = ref(-100)
const peakHoldDBFS = ref(-100)
const peakHoldPosition = ref(0)
const peakHoldInterval = ref(null)
const peakInterval = ref(null)
const playing = ref(false)
const steps = ref([0, -3, -6, -9, -12, -15, -18, -21, -27, -36, -48, -60])
const stepsThreshold = ref(-48)
const timeInterval = ref(null)
const tracks = ref([])
const volume = ref(10)

// List of settings to update
const settings = { gainMatch, muted, volume }

// Computed
const activeGain = computed(() =>
  active.value === 0 ? gainAmount.value.a : gainAmount.value.b
)
const decibelPosition = computed(() => {
  // Assuming peakDBFS.value, steps.value, and stepTotalWeights.value are available in scope
  const dbfs = peakDBFS.value
  const ticks = steps.value
  const totals = stepTotalWeights.value

  // Define the weights for each segment based on the ticks
  const weights = ticks.map((v) => (v >= -12 ? 1 : 0.5))
  const totalWeight = totals[totals.length - 1] // The last element is the sum of all weights

  // Find the two ticks that the dbfs is between
  let lowerIndex = ticks.findIndex(
    (step, index) =>
      dbfs <= step && dbfs > (ticks[index + 1] || ticks[ticks.length - 1])
  )
  lowerIndex = lowerIndex === -1 ? ticks.length - 1 : lowerIndex // Handle values below the scale

  // Calculate the percentage within the current segment
  const segmentStartDbfs = ticks[lowerIndex]
  const segmentEndDbfs = ticks[lowerIndex + 1] || -100 // Assume -100 dBFS at the end
  const segmentStartWeight = totals[lowerIndex] || 0 // Start weight for the segment
  const segmentWeight = weights[lowerIndex] // Weight for the current segment

  const dbfsRatioWithinSegment =
    (dbfs - segmentStartDbfs) / (segmentEndDbfs - segmentStartDbfs)
  const weightedPositionWithinSegment = dbfsRatioWithinSegment * segmentWeight

  // Calculate the total weight up to the dbfs value
  const weightUpToDbfsValue = segmentStartWeight + weightedPositionWithinSegment

  // Convert this to a percentage of the total weight
  const percentageOfTotalWeight = (weightUpToDbfsValue / totalWeight) * 100

  return percentageOfTotalWeight // This is the percentage of the meter height
})
const gainAmount = computed(() => {
  let result = { a: volumeLevel.value, b: volumeLevel.value }

  // Early Exits
  if (!filesReady.value || !gainMatch.value) return result
  if (files.a.measures === null || files.b.measures === null) return result
  if (isMuted.value) return { a: 0, b: 0 }

  const convert = (dBGain) => Math.pow(10, dBGain / 20)

  const rmsA = files.a.measures.avg.RMS
  const rmsB = files.b.measures.avg.RMS

  const gainA = rmsA >= rmsB ? 1 : convert(rmsB - rmsA)
  const gainB = rmsB >= rmsA ? 1 : convert(rmsA - rmsB)

  return { a: gainA * volumeLevel.value, b: gainB * volumeLevel.value }
})
const isLoading = computed(() => filesReady.value && !loaded.value)
const isMuted = computed(() => muted.value || volume.value === 0)
const meterHeight = computed(() => meter.value.clientHeight)
const stepPositions = computed(() => {
  const totalWeights = stepTotalWeights.value
  return steps.value.map(
    (_, index) =>
      (totalWeights[index] / totalWeights[totalWeights.length - 1]) *
      meterHeight.value
  )
})
const stepTotalWeights = computed(() => {
  const extendedWeights = [...stepWeights.value, 0.5]
  let cumulativeWeight = 0
  const totalWeights = extendedWeights.map((weight, index) => {
    if (index === 0) return 0
    cumulativeWeight += weight
    return cumulativeWeight
  })
  return totalWeights
})
const stepWeights = computed(() =>
  steps.value.map((v) => (v >= stepsThreshold.value ? 1 : 0.75))
)
const volumeLevel = computed(() => volume.value / 10)

// Watchers
watch(active, (active) => setActive(active))
watch(
  files,
  (files) => (filesReady.value = files.a.url !== null && files.b.url !== null)
)
watch(filesReady, async (filesReady) => {
  if (filesReady) {
    try {
      loaded.value = false
      if (multitrack !== null) multitrack.destroy()
      paused.value = false
      playing.value = false
      await initMulitrack()
    } catch (error) {
      console.error(`Unable to load mulitrack. Error: ${error}`)
    }
  }
})
watch(gainMatch, (gainMatch) => {
  updateSettings('gainMatch', gainMatch)
  if (multitrack) multitrack.setTrackVolume(active.value, activeGain.value)
})
watch(muted, (muted) => updateSettings('muted', muted))
watch(volume, (volume) => updateSettings('volume', volume))
watch(playing, (playing) => {
  if (playing) {
    peakInterval.value = setInterval(() => setPeak(), 50)
    peakHoldInterval.value = setInterval(() => setPeakHold(), 800)
  }
})
watch(paused, (paused) => paused && clearDBFS())
watch(peakClip, (clip) => {
  if (clip !== null) setTimeout(() => (peakClip.value = null), 1500)
})
watch(volume, () => {
  if (!filesReady.value) return
  multitrack.setTrackVolume(active.value, activeGain.value)
})

// Lifecycle
onMounted(() => init())
onUnmounted(() => unmount())

// Methods
const init = async () => {
  const files = { ...store.state.settings.reference }
  Object.keys(files).forEach((key) => (settings[key].value = files[key]))

  // Keyboard shortcuts
  document.addEventListener('keydown', eventsKeys)

  // File Drop
  listen('tauri://file-drop', async (e) => {
    if (fileKey.value === null) return
    await fileDrop({ path: e.payload[0] })
    fileKey.value = null
    tracks.value.forEach((track) => track.classList.remove('bg-tertiary/30'))
  })
}
const initMulitrack = async () => {
  // Get file measurements
  files.a.measures = await measure(files.a.url)
  files.b.measures = await measure(files.b.url)

  // Create tracks
  const trackArray = []
  Object.keys(files).forEach((key, index) => {
    const options = {
      id: files[key].id,
      draggable: false,
      options: {
        barGap: 1,
        barWidth: 2,
        progressColor: '#857371',
        waveColor: '#eb4444',
        media: new WebAudioPlayer(audioCtx),
      },
      startPosition: 0,
      volume: active.value === index ? activeGain.value : 0,
      url: files[key].url,
    }

    // Push options to array
    trackArray.push(options)
  })

  // Create multitrack
  multitrack = MultiTrack.create(trackArray, {
    container: container.value,
    cursorWidth: 2,
    cursorColor: '#eb4444',
    rightButtonDrag: false,
    trackBorderColor: '#3f3f46',
  })

  // Setup file indexes
  const trackUrls = multitrack.tracks.map((tracks) => tracks.url)
  files.a.index = trackUrls.indexOf(files.a.url)
  files.b.index = trackUrls.indexOf(files.b.url)

  // Setup once canplay
  multitrack.on('canplay', () => {
    loaded.value = true
    setActive(active.value)
    setupAudio()

    // Update fileKey on dragover
    multitrack.wavesurfers.forEach((ws, index) => {
      if (ws.options.waveColor === '#999') return
      const container = ws.options.container
      tracks.value.push(container)
      container.addEventListener('dragover', () => {
        fileKey.value = index === 0 ? 'a' : 'b'
        container.classList.add('bg-tertiary/30')
      })
      container.addEventListener('dragleave', () => {
        container.classList.remove('bg-tertiary/30')
      })
    })
  })
}
const clearDBFS = () => {
  clearInterval(peakInterval.value)
  clearInterval(peakHoldInterval.value)
  peakDBFS.value = -100
  peakHoldDBFS.value = -100
  peakHoldPosition.value = 0
}
const eventsKeys = (e) => {
  if (e.key === '1') e.preventDefault(), fileA.value.click()
  if (e.key === '2') e.preventDefault(), fileB.value.click()
  if (e.code === 'Space') play()
  if (e.key === 'Enter') stop()
  if (e.key === 't') toggle()
  if (e.key === 'g') setGainMatch(!gainMatch.value)
  if (e.key === 'm') setMute()
  if (e.key === 'ArrowLeft') skip(-10)
  if (e.key === 'ArrowRight') skip(10)
  if (e.key === 'ArrowUp') keyVolume(1)
  if (e.key === 'ArrowDown') keyVolume(-1)
}
const fileCapture = async (list, key) => {
  if (list.length === 0) return

  // Variables
  const file = list[0]
  const fileUrl = URL.createObjectURL(file)
  const type = fileType(file.type)

  // Check and cancel if file used in track
  if (file.name === files[key].name) {
    await message(locale('reference.tracks.error_used'))
    return
  }

  // Update
  filesReady.value = false
  files[key].id = encode(file.name)
  files[key].name = file.name
  files[key].name_split = file.name.split('.')[0]
  files[key].type = type
  files[key].url = fileUrl
}
const fileDrop = async ({ path }) => {
  if (fileKey.value === null) return

  // Variables
  const name = fileName(path)
  const fileUrl = convertFileSrc(path)
  const type = fileType(path.split('.').pop())

  // Check and cancel if file used in track
  if (name === files[fileKey.value].name) {
    await message(locale('reference.tracks.error_used'))
    return
  }

  // Update
  filesReady.value = false
  files[fileKey.value].id = encode(name)
  files[fileKey.value].name = name
  files[fileKey.value].name_split = name.split('.')[0]
  files[fileKey.value].type = type
  files[fileKey.value].url = fileUrl
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
const keyVolume = (num) => {
  if (!filesReady.value) return
  if (num === -1 && volume.value == 0) return
  if (num === 1 && volume.value == 10) return
  let amount = volume.value + num
  if (amount > 10) amount = 10
  if (amount < 0) amount = 0
  volume.value = amount
}
const measure = async (filePath) => {
  if (!filesReady.value) return
  const fileBuffer = await getAudioBuffer({ filePath })
  return await measureAudio({ fileBuffer, channels: 1 })
}
const play = () => {
  if (!filesReady.value) return
  if (multitrack.isPlaying()) {
    multitrack.pause()
    playing.value = false
    if (multitrack.getCurrentTime() > 0) paused.value = true
    else paused.value = false
  } else {
    multitrack.play()
    playing.value = true
    paused.value = false
  }
}
const setActive = (active) => {
  if (multitrack === null) return
  const opacity = 'opacity-15'
  const inActive = active === 0 ? 1 : 0
  multitrack.wavesurfers[inActive].options.container.classList.add(opacity)
  multitrack.wavesurfers[active].options.container.classList.remove(opacity)
}
const setGainMatch = (status = true) => {
  gainMatch.value = status
}
const setMute = () => {
  if (!filesReady.value) return
  muted.value = !muted.value
  multitrack.setTrackVolume(
    files.a.index,
    muted.value || active.value !== files.a.index ? 0 : gainAmount.value.a
  )
  multitrack.setTrackVolume(
    files.b.index,
    muted.value || active.value !== files.b.index ? 0 : gainAmount.value.b
  )
}
const setPeak = () => {
  // Set peak arrays
  peaksPositionsArray.value.push(decibelPosition.value)
  peakDBFS.value = getPeak()
  peaksArray.value.push(peakDBFS.value)

  if (peakDBFS.value > peakHoldDBFS.value) {
    peakHoldDBFS.value = peakDBFS.value
    peakHoldPosition.value = peakDBFS.value >= 0 ? 0 : decibelPosition.value
  }

  if (peakDBFS.value >= 0) peakClip.value = peakDBFS.value
}
const setPeakHold = () => {
  // Get average
  peakHoldDBFS.value = Math.max(...peaksArray.value)
  const positionIndex = peaksArray.value.indexOf(peakHoldDBFS.value)
  peakHoldPosition.value =
    peakHoldDBFS.value >= 0 ? 0 : peaksPositionsArray.value[positionIndex]

  // Reset
  peaksArray.value = []
  peaksPositionsArray.value = []
}
const setupAudio = () => {
  // Create analyzer
  if (analyser.value === null) {
    analyser.value = audioCtx.createAnalyser()
    analyser.value.fftSize = 1024
  }

  // Connect analyzer
  multitrack.wavesurfers[active.value].media.gainNode.connect(analyser.value)
}
const skip = (num) => {
  if (!filesReady.value) return
  multitrack.setTime(multitrack.getCurrentTime() + num)
}
const stop = () => {
  if (!filesReady.value) return
  paused.value = false
  playing.value = false
  multitrack.pause()
  multitrack.setTime(0)
}
const toggle = () => {
  if (!filesReady.value) return
  // Flip active index
  active.value = active.value === files.a.index ? files.b.index : files.a.index

  // Flip volumes
  multitrack.setTrackVolume(
    files.a.index,
    active.value === files.a.index ? gainAmount.value.a : 0
  )
  multitrack.setTrackVolume(
    files.b.index,
    active.value === files.b.index ? gainAmount.value.b : 0
  )

  // Setup audio
  setupAudio()

  // Remove muted
  muted.value = false
}
const unmount = () => {
  document.removeEventListener('keydown', eventsKeys)
  files.a = { ...fileStruct }
  files.b = { ...fileStruct }

  if (multitrack !== null) {
    multitrack.destroy()
    multitrack = null
  }
}
const updateSettings = async (key, value) => {
  store.dispatch('updateSetting', {
    key: 'reference',
    value: { [key]: value },
  })
  settings[key].value = value
}
</script>

<template>
  <section id="Reference" class="w-screen h-screen">
    <!-- Main Content -->
    <div class="flex flex-col items-center justify-center h-full w-full">
      <!-- Title -->
      <div class="flex justify-center items-baseline gap-2 mb-6">
        <h1 class="title text-center">
          {{ $filters.locale('reference.title') }}
        </h1>
        <div class="relative">
          <Info class="peer cursor-help" />
          <div class="hidden peer-hover:flex info-popover">
            <div>{{ $filters.locale('reference.info') }}</div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <Loading
        v-if="isLoading"
        :showText="false"
        class="flex items-center justify-center"
      />

      <!-- Gain Match & Duration -->
      <div
        class="flex items-stretch gap-2 mb-4"
        :class="{ 'invisible h-0': isLoading }"
      >
        <template v-if="gainAmount !== null">
          <button
            class="flex items-center justify-center gap-2 py-1 pl-3 pr-4 rounded-lg border border-neutral-200 dark:border-surface-variant-accent relative hover:bg-stone-100 dark:hover:bg-neutral-800 active:translate-y-[0.075rem]"
            @click.prevent="setGainMatch(!gainMatch)"
          >
            <CheckCircle v-if="gainMatch" class="text-tertiary" />
            <XCircle v-if="!gainMatch" class="text-error" />

            <span v-if="gainMatch">
              {{ $filters.locale('reference.gain.on') }}
            </span>
            <span v-if="!gainMatch">
              {{ $filters.locale('reference.gain.off') }}
            </span>

            <Shortcut
              class="right-[105%]"
              locale="reference.shortcuts.toggle_match"
              position="left"
            />
          </button>
        </template>

        <div
          class="flex items-center gap-1 py-1 px-3 rounded-lg border border-neutral-200 dark:border-surface-variant-accent cursor-default"
        >
          <template v-if="loaded">
            <span class="tabular-nums">
              {{ timeString(multitrack.currentTime) }}
            </span>
            <span>/</span>
            <span class="tabular-nums">
              {{ timeString(multitrack.maxDuration) }}
            </span>
          </template>
          <template v-else>
            <span>&#8734;</span>
          </template>
        </div>
      </div>

      <!-- Rows -->
      <div
        class="flex items-stretch justify-center gap-4 w-10/12"
        :class="{ 'invisible h-0': isLoading }"
      >
        <!-- Form -->
        <form
          class="grow relative rounded-md bg-neutral-100 dark:bg-surface-variant border border-neutral-200 dark:border-surface-variant-accent"
        >
          <input
            id="fileA"
            ref="fileA"
            type="file"
            class="sr-only"
            accept="audio/*"
            :aria-label="$filters.locale('reference.labels.add_a')"
            @change="(e) => fileCapture(e.target.files, 'a')"
          />
          <input
            id="fileB"
            ref="fileB"
            type="file"
            class="sr-only"
            accept="audio/*"
            :aria-label="$filters.locale('reference.labels.add_b')"
            @change="(e) => fileCapture(e.target.files, 'b')"
          />

          <!-- Multitrack -->
          <div
            class="flex flex-col divide-y divide-neutral-200 dark:divide-surface-variant-accent"
          >
            <template v-if="!loaded && !isLoading">
              <div
                class="w-full h-32 flex items-center justify-center"
                :class="{ 'bg-tertiary/10': fileKey === 'a' }"
                @dragover.prevent="fileKey = 'a'"
              >
                <button
                  v-if="files.a.name === null"
                  @click.prevent="$refs.fileA.click()"
                  class="btn py-2 relative"
                >
                  <span>{{ $filters.locale('reference.labels.add_a') }}</span>
                  <Shortcut
                    class="w-20"
                    locale="reference.shortcuts.file_a"
                    position="right"
                  />
                </button>

                <div v-else class="flex items-center gap-2 opacity-75">
                  <span>
                    {{
                      $filters.locale('reference.tracks.load', {
                        file: files.a.name,
                      })
                    }}
                  </span>
                  <span class="pill-tertiary pill-xs">
                    {{ files.a.type }}
                  </span>
                </div>
              </div>
            </template>

            <template v-if="!loaded && !isLoading">
              <div
                class="w-full h-32 flex items-center justify-center"
                :class="{ 'bg-tertiary/10': fileKey === 'b' }"
                @dragover.prevent="fileKey = 'b'"
              >
                <button
                  v-if="files.b.name === null"
                  @click.prevent="$refs.fileB.click()"
                  class="btn py-2 relative"
                >
                  <span>{{ $filters.locale('reference.labels.add_b') }}</span>

                  <Shortcut
                    class="w-20"
                    locale="reference.shortcuts.file_b"
                    position="right"
                  />
                </button>

                <div v-else class="flex items-center gap-2 opacity-75">
                  <span>
                    {{
                      $filters.locale('reference.tracks.load', {
                        file: files.b.name,
                      })
                    }}
                  </span>
                  <span class="pill-tertiary pill-xs">
                    {{ files.b.type }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Mulitrack Output -->
            <div
              ref="container"
              class="multitrack relative"
              @dragleave.prevent="fileKey = null"
            >
              <template v-if="loaded">
                <!-- File A Replace -->
                <button
                  @click.prevent="$refs.fileA.click()"
                  class="absolute top-1.5 left-2 z-10 p-1.5 rounded-lg text-xs bg-neutral-200 dark:bg-surface-variant-accent opacity-40 hover:opacity-100 flex items-center justify-between gap-1.5 w-32 max-w-fit hover:w-full transition-all duration-500 ease-in-out"
                >
                  <DocumentAdd />
                  <span class="truncate">
                    {{ files.a.name_split }}
                  </span>
                  <span class="pill-tertiary pill-xs">
                    {{ files.a.type }}
                  </span>
                </button>

                <!-- File B Replace -->
                <button
                  @click.prevent="$refs.fileB.click()"
                  class="absolute bottom-[1.75rem] left-2 z-10 p-1.5 rounded-lg text-xs bg-neutral-200 dark:bg-surface-variant-accent opacity-40 hover:opacity-100 flex items-center justify-between gap-1.5 w-32 max-w-fit hover:w-full transition-all duration-500 ease-in-out"
                >
                  <DocumentAdd />
                  <span class="truncate">
                    {{ files.b.name_split }}
                  </span>
                  <span class="pill-tertiary pill-xs">
                    {{ files.b.type }}
                  </span>
                </button>
              </template>
            </div>
          </div>

          <!-- Controls -->
          <div
            class="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-10 -mt-1.5"
          >
            <template v-if="filesReady">
              <div class="card p-2 rounded-lg flex gap-2 relative">
                <button
                  @click.prevent="play()"
                  :disabled="!filesReady"
                  class="btn py-[0.1rem] px-[0.2rem] rounded-md transition relative"
                >
                  <PlayPause
                    v-if="paused || !playing"
                    classes="h-[1.1rem] w-[1.1rem]"
                  />
                  <Pause v-if="playing" classes="h-[1.1rem] w-[1.1rem]" />

                  <Shortcut
                    class="bottom-[130%] whitespace-normal w-[4.25rem]"
                    locale="reference.shortcuts.play"
                    position="top"
                  />
                </button>

                <button
                  @click.prevent="stop()"
                  :disabled="!playing"
                  class="btn py-[0.1rem] px-[0.2rem] rounded-md transition relative"
                >
                  <Stop classes="h-[1.1rem] w-[1.1rem]" />

                  <Shortcut
                    class="top-[140%] w-[5rem]"
                    locale="reference.shortcuts.stop"
                    position="bottom"
                  />
                </button>

                <button
                  @click.prevent="toggle()"
                  :disabled="!filesReady"
                  class="btn py-[0.1rem] px-[0.2rem] rounded-md transition relative"
                >
                  <ArrowsUpDown classes="h-[1.1rem] w-[1.1rem]" />

                  <Shortcut
                    class="bottom-[130%] whitespace-normal w-[4.25rem]"
                    locale="reference.shortcuts.toggle_song"
                    position="top"
                  />
                </button>

                <!-- Shortcuts -->
                <Shortcut
                  locale="reference.shortcuts.skip_left"
                  position="left"
                />
                <Shortcut
                  locale="reference.shortcuts.skip_right"
                  position="right"
                />
              </div>
            </template>
          </div>
        </form>

        <!-- Meter Container -->
        <div
          class="w-8 h-full shrink flex flex-col gap-2 items-start justify-center"
        >
          <!-- Meter -->
          <div ref="meter" class="w-full grow flex gap-1 relative rounded-md">
            <!-- Steps -->
            <ul
              class="relative h-full w-8 text-[0.6rem] text-neutral-400 dark:text-neutral-500"
            >
              <li
                v-for="(step, index) in steps"
                class="absolute right-0 text-right"
                :style="`top: ${(stepPositions[index] / meterHeight) * 100}%;`"
              >
                {{ step }}
              </li>
            </ul>

            <!-- Fader -->
            <div
              class="relative h-full w-[1.15rem] bg-meter border border-neutral-200 dark:border-surface-variant-accent"
            >
              <div
                v-if="peakClip !== null"
                class="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-primary text-on-primary px-1.5 py-1 rounded-lg tabular-nums"
              >
                {{ peakClip }}
              </div>
              <!-- Meter -->
              <div
                class="w-full bg-scheme transition-all duration-[50ms] ease-linear mr-10 relative"
                :style="`height: ${decibelPosition}%`"
              ></div>

              <!-- Peak Hold -->
              <div
                v-if="peakHoldDBFS > -100"
                class="w-full h-0.5 -translate-y-1/2 absolute inset-x-0 transition-transform duration-75"
                :class="{
                  'bg-green-700': peakHoldDBFS < -9,
                  'bg-amber-400': peakHoldDBFS >= -9,
                  'bg-red-700': peakHoldDBFS >= -1,
                }"
                :style="`top: ${peakHoldPosition.toFixed(2)}%;`"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Volume -->
      <div
        class="flex flex-col items-center gap-x-6 pt-6 pb-0 w-1/3"
        :class="{ 'invisible h-0': isLoading }"
      >
        <div class="w-full relative">
          <label for="volume" class="sr-only">
            {{ $filters.locale('reference.controls.volume') }}
          </label>
          <input
            id="volume"
            type="range"
            list="tickmarks"
            name="volume"
            step="0.25"
            min="0"
            max="10"
            :disabled="!filesReady"
            v-model.number="volume"
            class="range"
          />
          <button
            class="absolute top-1 -left-7 opacity-90 transition-opacity text-neutral-600 disabled:text-neutral-500 hover:text-neutral-950 dark:text-neutral-600 dark:hover:text-neutral-400 dark:disabled:text-neutral-700"
            @click.prevent="setMute()"
            :disabled="!filesReady"
            :title="$filters.locale('reference.controls.volume')"
            :aria-label="$filters.locale('reference.controls.volume')"
          >
            <SpeakerMute
              v-if="isMuted"
              class="text-primary"
              classes="h-5 w-5"
            />
            <Speaker v-else classes="h-5 w-5" />

            <Shortcut
              class="right-[125%] w-20"
              locale="reference.shortcuts.mute"
              position="left"
            />
          </button>

          <Shortcut
            class="top-[40%] left-[102%]"
            locale="reference.shortcuts.volume"
            position="right"
          />
        </div>

        <div
          class="range-ticks-container"
          :class="{ 'opacity-40': !filesReady }"
        >
          <div v-for="num in 11" :key="num" class="range-ticks">
            <span>{{ num - 1 }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
