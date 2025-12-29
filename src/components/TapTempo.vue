<script>
import { defineAsyncComponent } from 'vue'
import { locale } from '@/utils/locale'
import stick from '../assets/stick.wav'

export default {
  components: {
    Arrow: defineAsyncComponent(() => import('@/icons/Arrow.vue')),
    Speaker: defineAsyncComponent(() => import('@/icons/Speaker.vue')),
    Shortcut: defineAsyncComponent(() => import('@/components/Shortcut.vue')),
    SpeakerMute: defineAsyncComponent(() => import('@/icons/SpeakerMute.vue')),
  },
  data() {
    return {
      audioCxt: new AudioContext(),
      autoupdate_tap: true,
      buffer: null,
      beats: 4,
      tempo: 0,
      tempos: [],
      timeOld: null,
      volume: 0.8,
      volume_last: 0.8,
    }
  },
  computed: {
    disabled() {
      return this.tempo === 0
    },
    isMuted() {
      return parseFloat(this.volume) === 0
    },
  },
  watch: {
    autoupdate_tap(autoupdate_tap) {
      this.$store.dispatch('updateSetting', {
        key: 'milliseconds',
        value: { autoupdate_tap: this.autoupdate_tap },
      })
    },
  },
  mounted() {
    this.init()
    this.$refs.tap.focus()
    document.addEventListener('keydown', this.onKey)
  },
  unmounted() {
    document.removeEventListener('keydown', this.onKey)
    this.audioCxt.close()
  },
  methods: {
    init() {
      this.autoupdate_tap =
        this.$store.state.settings.milliseconds.autoupdate_tap
      this.volume = this.$store.state.settings.milliseconds.tap_volume
      this.volume_last = this.$store.state.settings.milliseconds.tap_volume_last

      this.initAudio()
    },
    initAudio() {
      fetch(stick)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => this.audioCxt.decodeAudioData(arrayBuffer))
        .then((buffer) => (this.buffer = buffer))
        .catch((error) => console.error(`'Error fetching or decoding audio file: ${error}`))
    },
    onKey(event) {
      if (event.key === 't') this.tap()
    },
    playAudio() {
      const source = this.audioCxt.createBufferSource()
      const gainNode = this.audioCxt.createGain()

      source.buffer = this.buffer
      source.connect(gainNode)
      gainNode.connect(this.audioCxt.destination)
      source.start(0)

      gainNode.gain.value = parseFloat(this.volume)
    },
    round(tempos) {
      return Math.ceil(tempos.reduce((a, b) => a + b, 0) / tempos.length)
    },
    tap() {
      this.playAudio()

      const timeCurrent = parseInt(new Date().getTime(), 10)
      const tempoCurrent = Math.ceil(60000 / (timeCurrent - this.timeOld))
      this.tempos.unshift(tempoCurrent)
      this.tempos = this.tempos.slice(0, this.beats)
      this.tempo = this.round(this.tempos)
      this.timeOld = timeCurrent

      if (this.autoupdate_tap) this.updateSilent()
    },
    toggleMute() {
      const volumeCurrent = this.volume
      this.volume = volumeCurrent === 0 ? this.volume_last : 0
      this.volume_last = volumeCurrent
      this.updateSetting('tap_volume', this.volume)
      this.updateSetting('tap_volume_last', this.volume_last)
    },
    update() {
      this.$store.dispatch('updateSetting', {
        key: 'milliseconds',
        value: { tempo: this.tempo },
      })

      this.$store.dispatch(
        'notify',
        locale('files.updated', { tempo: this.tempo })
      )
    },
    updateSilent() {
      this.$store.dispatch('updateSetting', {
        key: 'milliseconds',
        value: { tempo: this.tempo },
      })
    },
    updateSetting(key, value) {
      this.$store.dispatch('updateSetting', {
        key: 'milliseconds',
        value: { [key]: value },
      })
    },
  },
}
</script>

<template>
  <div class="relative">
    <div
      class="fixed inset-0 bg-scheme h-screen w-screen z-10 flex items-center justify-center"
    >
      <div class="flex flex-col gap-4 items-center">
        <h2 class="title">{{ $filters.locale('milliseconds.tap_tempo') }}</h2>
        <div class="flex gap-0.5 items-baseline">
          <div class="text-9xl font-bold cursor-default">{{ tempo }}</div>
          <div
            class="text-2xl text-neutral-600 dark:text-neutral-500 font-medium"
          >
            {{ $filters.locale('general.bpm') }}
          </div>
        </div>
        <div class="flex gap-x-3">
          <button ref="tap" class="btn relative" @click.prevent="tap()">
            <span>{{ $filters.locale('milliseconds.tap') }}</span>
            <Shortcut position="left" locale="milliseconds.shortcuts.tap" />
          </button>

          <button @click.prevent="update()" :disabled="disabled">
            <Arrow direction="up" type="circle" classes="w-9 h-9" />
            <span class="sr-only">
              {{ $filters.locale('milliseconds.tap_update') }}
            </span>
          </button>
        </div>

        <div class="flex items-center justify-center space-x-2">
          <input
            id="autoupdate_tap"
            type="checkbox"
            name="autoupdate_tap"
            v-model="autoupdate_tap"
            :unchecked-value="false"
            :value="true"
          />
          <label for="autoupdate_tap" class="text-base dark:text-neutral-50">
            {{ $filters.locale('files.autoupdate') }}
          </label>
        </div>

        <div class="flex justify-between items-start gap-3 py-3">
          <div class="flex flex-col w-64">
            <input
              id="volume"
              v-model="volume"
              name="volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="range"
              @change="updateSetting('tap_volume', volume)"
            />
            <div class="range-ticks-container">
              <div v-for="num in 11" :key="num" class="range-ticks">
                {{ num - 1 }}
              </div>
            </div>
          </div>

          <div
            class="top-1 relative text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400"
          >
            <button @click.prevent="toggleMute()">
              <SpeakerMute
                v-if="isMuted"
                class="text-primary"
                classes="h-5 w-5"
              />
              <Speaker v-else classes="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          class="absolute top-1/4 right-1/4 opacity-60 hover:opacity-100 transition-opacity"
        >
          <slot name="close" />
        </div>
      </div>
    </div>
  </div>
</template>
