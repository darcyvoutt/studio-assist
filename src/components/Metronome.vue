<script>
import { defineAsyncComponent } from 'vue'

const audioCxt = new AudioContext()

export default {
  components: {
    Chevron: defineAsyncComponent(() => import('@/icons/Chevron.vue')),
    Speaker: defineAsyncComponent(() => import('@/icons/Speaker.vue')),
    Shortcut: defineAsyncComponent(() => import('@/components/Shortcut.vue')),
    SpeakerMute: defineAsyncComponent(() => import('@/icons/SpeakerMute.vue')),
  },
  props: {
    tempo: {
      type: Number,
      default: 120,
    },
  },
  data() {
    return {
      active: false,
      audioCxt: null,
      beats: 4,
      counter: 0,
      down: null,
      length: 0.1,
      position: 0,
      tick_tone: 440,
      tick_tone_start: 555,
      tick_volume: 0.5,
      settings: false,
      sound: null,
    }
  },
  mounted() {
    this.init()
  },
  beforeUnmount() {
    this.active = false
  },
  computed: {
    isMuted() {
      return parseFloat(this.volume) === 0
    },
    volume() {
      return parseFloat(this.$store.state.settings.configs.tick_volume)
    },
  },
  watch: {
    active(active) {
      this.$nextTick(() => {
        if (active) this.$refs.stop.focus()
        else this.$refs.start.focus()
      })
    },
  },
  methods: {
    init() {
      const configs = { ...this.$store.state.settings.configs }
      Object.keys(configs).forEach((key) => (this[key] = configs[key]))
      this.$refs.start.focus()
    },
    pulse() {
      const sound = audioCxt.createOscillator()
      const gainNode = audioCxt.createGain()

      this.down = this.counter++ % this.beats === 0
      this.position = ((this.counter - 1) % this.beats) + 1

      sound.frequency.value = this.down ? this.tick_tone_start : this.tick_tone
      sound.connect(gainNode)

      gainNode.gain.value = this.volume
      gainNode.connect(audioCxt.destination)

      sound.start(audioCxt.currentTime)
      sound.stop(audioCxt.currentTime + this.length)
    },
    async start() {
      audioCxt.resume()
      this.active = true

      while (this.active) {
        this.pulse()
        await this.wait(60 / this.tempo)
      }
    },
    stop() {
      audioCxt.suspend()
      this.active = false
      this.counter = 0
      this.position = 0
    },
    async wait(seconds) {
      return new Promise((r) => setTimeout(r, seconds * 1e3))
    },
    async updateSetting(key, value) {
      this.$store.dispatch('updateSetting', {
        key: 'configs',
        value: { [key]: value },
      })
    },
  },
}
</script>

<template>
  <div class="absolute inset-0 bg-scheme-fade w-full h-[110%] z-30">
    <div class="relative flex flex-col justify-center items-center h-full">
      <!-- Metronome -->
      <ul class="flex items-center gap-x-8 mb-10">
        <li
          v-for="beat in beats"
          :key="beat"
          class="h-8 w-8 aspect-square flex items-center justify-center"
        >
          <div
            class="h-4 w-4 aspect-square rounded-full bg-neutral-500 transition-all duration-300 ease-in-out"
            :class="{
              'h-8 w-8 bg-primary-interactive ring ring-primary':
                position === beat,
            }"
          ></div>
        </li>
      </ul>

      <!-- Action Buttons -->
      <div class="flex gap-4">
        <button
          ref="start"
          class="btn-md relative"
          :class="{ 'btn-outline': active, btn: !active }"
          @click.prevent="start()"
          :disabled="active"
        >
          <span>{{ $filters.locale('metronome.start') }}</span>
          <Shortcut position="left" locale="metronome.shortcuts.start" />
        </button>
        <button
          ref="stop"
          class="btn-md relative"
          :class="{ 'btn-critical': active, 'btn-outline-critical': !active }"
          @click.prevent="stop()"
          :disabled="!active"
        >
          <span>{{ $filters.locale('metronome.stop') }}</span>
          <Shortcut position="right" locale="metronome.shortcuts.stop" />
        </button>
      </div>

      <!-- Button for settings -->
      <button
        @click.prevent="settings = !settings"
        class="flex items-center gap-x-1.5 my-5 text-sm opacity-50 hover:opacity-100 transition-opacity select-none"
      >
        <span class="border-b pb-0.5">
          {{ $filters.locale('metronome.settings') }}
        </span>
        <Chevron v-if="!settings" direction="down" />
        <Chevron v-if="settings" direction="up" />
      </button>

      <!-- Settings -->
      <aside
        class="border-scheme rounded-md bg-neutral-100 dark:bg-neutral-800 transition-all overflow-hidden"
        :class="{
          'h-auto p-6 border': settings,
          'h-0 p-0': !settings,
        }"
      >
        <div class="grid grid-cols-7 justify-center gap-8">
          <!-- Count Option -->
          <div class="col-span-2 flex flex-col items-center">
            <h3 class="uppercase text-xs opacity-40 pb-3.5">
              {{ $filters.locale('metronome.tone.heading') }}
            </h3>
            <div class="flex items-center gap-4">
              <input
                v-model.number="beats"
                type="number"
                min="2"
                max="8"
                class="input w-14 text-center"
                @input="updateSetting('beats', beats)"
              />
              <span class="text-lg">/</span>
              <span class="text-lg">4</span>
            </div>
          </div>

          <!-- Tick Tones -->
          <div class="col-span-2 flex flex-col items-center">
            <h3 class="uppercase text-xs opacity-40 pb-3.5">
              {{ $filters.locale('metronome.tone.heading') }}
            </h3>
            <div class="flex items-center gap-x-6">
              <div class="flex gap-x-2">
                <div class="flex flex-col items-center gap-1">
                  <input
                    id="tick_tone_start"
                    type="number"
                    class="input text-center w-20"
                    v-model.number="tick_tone_start"
                    @input="updateSetting('tick_tone_start', tick_tone_start)"
                    min="0"
                    max="24000"
                  />
                  <label
                    for="tick_tone_start"
                    class="text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    {{ $filters.locale('metronome.tone.tick_tone_start') }}

                    <span class="text-xs opacity-60 font-medium pt-3">
                      ({{ $filters.locale('general.frequencies.kilohertz') }})
                    </span>
                  </label>
                </div>
              </div>

              <div class="flex gap-x-2">
                <div class="flex flex-col items-center gap-1">
                  <input
                    id="tick_tone"
                    type="number"
                    class="input text-center w-20"
                    v-model.number="tick_tone"
                    @input="updateSetting('tick_tone', tick_tone)"
                    min="0"
                    max="24000"
                  />
                  <label
                    for="tick_tone"
                    class="text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    {{ $filters.locale('metronome.tone.tick_tone') }}
                    <span class="text-xs opacity-60 font-medium pt-3">
                      ({{ $filters.locale('general.frequencies.hertz') }})
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Volume -->
          <div
            class="col-span-3 flex flex-col items-center gap-x-6 max-w-md px-2"
          >
            <label
              for="tick_volume"
              class="uppercase text-xs opacity-40 pb-3.5 flex items-center gap-1"
            >
              <span>
                {{ $filters.locale('metronome.volume.heading') }}
              </span>
              <span>
                <SpeakerMute
                  v-if="isMuted"
                  class="text-primary"
                  classes="h-4 w-4"
                />
                <Speaker v-else classes="h-4 w-4" />
              </span>
            </label>
            <input
              id="tick_volume"
              v-model="tick_volume"
              list="tickmarks"
              name="tick_volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="range"
              @change="updateSetting('tick_volume', tick_volume)"
            />
            <div class="range-ticks-container">
              <div v-for="num in 11" :key="num" class="range-ticks">
                <span>{{ num - 1 }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Close -->
      <div
        class="absolute top-14 right-48 opacity-60 hover:opacity-100 transition-opacity"
      >
        <slot name="close" />
      </div>
    </div>
  </div>
</template>
