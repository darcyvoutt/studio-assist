<script>
import { defineAsyncComponent } from 'vue'

// Tauri APIs
import { writeText } from '@tauri-apps/api/clipboard'

// Utilities
import { trimDecimals } from '@/utils/convert'
import { locale } from '@/utils/locale'
import { getOS } from '@/utils/os'

export default {
  components: {
    Alert: defineAsyncComponent(() => import('@/components/Alert.vue')),
    Chevron: defineAsyncComponent(() => import('@/icons/Chevron.vue')),
    Close: defineAsyncComponent(() => import('@/icons/Close.vue')),
    CursorArrays: defineAsyncComponent(() =>
      import('@/icons/CursorArrays.vue')
    ),
    Info: defineAsyncComponent(() => import('@/icons/Info.vue')),
    MetronomeComp: defineAsyncComponent(() =>
      import('@/components/Metronome.vue')
    ),
    MetronomeIcon: defineAsyncComponent(() => import('@/icons/Metronome.vue')),
    Minus: defineAsyncComponent(() => import('@/icons/Minus.vue')),
    Plus: defineAsyncComponent(() => import('@/icons/Plus.vue')),
    TapTempo: defineAsyncComponent(() => import('@/components/TapTempo.vue')),
    Shortcut: defineAsyncComponent(() => import('@/components/Shortcut.vue')),
  },
  data() {
    return {
      modifiers: {
        dotted: 1.5,
        standard: 1,
        triplets: 0.667,
      },
      predelay: {
        options: [
          { text: 'milliseconds.predelays.none', value: 0 },
          { text: 'milliseconds.predelays.256', value: 0.015625 },
          { text: 'milliseconds.predelays.128', value: 0.03125 },
          { text: 'milliseconds.predelays.64', value: 0.0625 },
          { text: 'milliseconds.predelays.32', value: 0.125 },
          { text: 'milliseconds.predelays.16', value: 0.25 },
          { text: 'milliseconds.predelays.8', value: 0.5 },
          { text: 'milliseconds.predelays.4', value: 1 },
        ],
        // Set by state on load
        selected: 0,
      },
      metronome: false,
      notation: 0.5,
      notes: {
        'milliseconds.notes.128': 0.03125,
        'milliseconds.notes.64': 0.0625,
        'milliseconds.notes.32': 0.125,
        'milliseconds.notes.16': 0.25,
        'milliseconds.notes.8': 0.5,
        'milliseconds.notes.4': 1,
        'milliseconds.notes.2': 2,
        'milliseconds.notes.1': 4,
        'milliseconds.notes.1half': 6,
        'milliseconds.notes.2bars': 8,
        'milliseconds.notes.3bars': 12,
        'milliseconds.notes.4bars': 16,
      },
      tap: false,
      tempo: 120, // Set by state on load
      slide: 1,
      showSeconds: false,
      swing: 0,
      swingMax: 50,
    }
  },
  computed: {
    predelays() {
      return {
        dotted: this.milliseconds({
          notation: this.predelay.selected,
          modifier: this.modifiers.dotted,
          isPredelay: true,
        }),
        standard: this.milliseconds({
          notation: this.predelay.selected,
          modifier: this.modifiers.standard,
          isPredelay: true,
        }),
        triplets: this.milliseconds({
          notation: this.predelay.selected,
          modifier: this.modifiers.triplets,
          isPredelay: true,
        }),
      }
    },
    selected() {
      return this.predelay.selected
    },
    swingAmount() {
      return this.swing === 0 ? 1 : this.swing / 100 + 1
    },
    showShortcuts() {
      return this.$store.state.shortcuts
    },
  },
  watch: {
    selected(predelay) {
      this.updateSettings({ predelay })
    },
    slide(slide) {
      this.updateSettings({ slide })
    },
    swing(swing) {
      this.updateSettings({ swing })
    },
    tempo(tempo) {
      this.updateSettings({ tempo })
    },
  },
  created() {
    this.init()
  },
  mounted() {
    this.detectShortcut()
  },
  methods: {
    init() {
      const milliseconds = { ...this.$store.state.settings.milliseconds }
      Object.keys(milliseconds).forEach((key) => {
        if (key === 'predelay') this[key].selected = milliseconds[key]
        else this[key] = milliseconds[key]
      })
    },
    async copy(event, args) {
      const os = await getOS()
      const decimals = this.$store.state.settings.configs.decimals
      let convertSeconds = false

      if (os.macos && event.metaKey) convertSeconds = true
      if (os.windows && event.ctrlKey) convertSeconds = true

      Object.assign(args, { seconds: convertSeconds })

      const number = convertSeconds
        ? this.milliseconds(args) / 1000
        : this.milliseconds(args)

      await writeText(trimDecimals(number, decimals))
      await this.notify(args)
    },
    async notify(args) {
      const time = args.seconds
        ? locale('general.time.seconds')
        : locale('general.time.milliseconds')

      const notation = Object.keys(this.notes).find((key) => {
        return this.notes[key] === args.notation
      })

      const message = locale('milliseconds.copied', {
        time,
        notation: locale(notation),
      })

      this.$store.dispatch('notify', message)
    },
    calcTime(args) {
      return `${this.calcNumber(args)} ${this.displaySymbol(args)}`
    },
    calcNumber(args) {
      return this.milliseconds(args) >= 1000
        ? (this.milliseconds(args) / 1000).toFixed(2) // Seconds
        : this.milliseconds(args).toFixed(0) // Milliseconds
    },
    detectShortcut() {
      document.addEventListener('keydown', (e) => {
        if (e.metaKey && !this.metronome) this.showSeconds = true
      })
      document.addEventListener('keyup', () => (this.showSeconds = false))
    },
    disableSwing(amount) {
      return this.swing === amount
    },
    displaySymbol(args) {
      if (this.tempo > 0 && this.milliseconds(args) < 1000)
        return locale('general.time.ms')
      return locale('general.time.sec')
    },
    increment(increment) {
      this.tempo = this.tempo + parseFloat(increment)
    },
    milliseconds({
      notation,
      modifier,
      modifierName = null,
      isPredelay = false,
    }) {
      // Calculate Base Milliseconds
      const msCalc = (60000 / (parseFloat(this.tempo) / notation)) * modifier
      const milliseconds = msCalc * this.swingAmount

      // Adjustments for Predelay
      return modifierName !== null &&
        this.predelay.selected !== null &&
        isPredelay === false
        ? milliseconds - this.predelays[modifierName]
        : milliseconds
    },
    scale(index) {
      const diff = this.slide - index
      if (diff === 0) return 'scale-[115%]'
      if (diff === 1 || diff === -1) return 'scale-[85%] opacity-60'
      if (diff > 1 || diff < -1) return 'opacity-0'
    },
    showTap(boolean) {
      this.init()
      this.metronome = false
      this.tap = boolean
    },
    slideDisable(number) {
      return number !== 1
    },
    swingIncrement(value) {
      // Resetting Value
      if (value === 0) {
        this.swing = value
        return
      }

      // Incrementing Value
      const increment = this.swing + value
      if (increment > this.swingMax) this.swing = this.swingMax
      else if (increment < -this.swingMax) this.swing = -this.swingMax
      else this.swing = this.swing + value
    },
    updateSettings(property) {
      if (typeof property !== 'object') return

      this.$store.dispatch('updateSetting', {
        key: 'milliseconds',
        value: property,
      })
    },
  },
}
</script>

<template>
  <section
    id="Milliseconds"
    class="w-full h-full flex flex-col justify-center overflow-x-hidden"
  >
    <div>
      <!-- Title -->
      <div class="flex justify-center items-baseline gap-2 mb-6">
        <h1 class="title">
          {{ $filters.locale('milliseconds.title') }}
        </h1>
        <div class="relative">
          <Info class="peer cursor-help" />
          <div class="hidden peer-hover:flex info-popover">
            <div>{{ $filters.locale('milliseconds.info') }}</div>
          </div>
        </div>
      </div>

      <!-- Calculator -->
      <div class="flex flex-col justify-center space-y-3">
        <!-- BPM -->
        <div
          id="bpm"
          class="flex flex-row space-x-2 items-center justify-center pb-3"
        >
          <button type="button" @click="increment(-1)" class="btn-circle">
            <span class="sr-only">
              {{ $filters.locale('milliseconds.decrease') }}
            </span>
            <Minus />
          </button>

          <label for="tempo">
            <span class="sr-only">
              {{ $filters.locale('milliseconds.tempo') }}
            </span>
          </label>

          <div class="relative">
            <input
              id="tempo"
              class="w-48 text-8xl text-center hover:scale-105 font-bold hide-spinner border-none rounded-lg focus:ring-primary-interactive bg-transparent peer focus transition duration-300"
              v-model.number="tempo"
            />
            <div
              class="absolute bottom-1.5 -right-2 -rotate-[20deg] peer-focus:scale-110 transition"
            >
              <div class="bg-primary text-white py-0.5 px-2 rounded-lg">
                {{ $filters.locale('general.bpm') }}
              </div>
            </div>
          </div>

          <button type="button" @click="increment(1)" class="btn-circle">
            <span class="sr-only">
              {{ $filters.locale('milliseconds.increase') }}
            </span>
            <Plus />
          </button>
        </div>

        <!-- Pre-Delay -->
        <div
          id="predelay"
          class="flex flex-row space-x-2 items-center justify-center pb-3"
        >
          <label for="predelay" class="sr-only">
            {{ $filters.locale('milliseconds.predelay') }}
          </label>
          <select
            id="predelay"
            name="predelay"
            v-model="predelay.selected"
            class="select w-40"
          >
            <option
              v-for="option in predelay.options"
              :key="option.text"
              :value="option.value"
            >
              {{ $filters.locale(option.text) }}
            </option>
          </select>

          <!-- Show Tap Tempo -->
          <button @click.prevent="showTap(true)" class="active:scale-90 pl-2">
            <CursorArrays
              classes="h-7 w-7 border-2 border-scheme p-1.5 rounded-full w-9 h-9 overflow-hidden hover:bg-tertiary/50 hover:border-tertiary transition-all"
            />
            <span class="sr-only">
              {{ $filters.locale('milliseconds.tap_tempo') }}
            </span>
          </button>

          <!-- Show Metronome -->
          <button
            @click.prevent="metronome = !metronome"
            class="active:scale-90"
          >
            <MetronomeIcon
              classes="h-7 w-7 border-2 border-scheme p-1.5 rounded-full w-9 h-9 overflow-hidden hover:bg-tertiary/50 hover:border-tertiary transition-all"
            />
            <span class="sr-only">
              {{ $filters.locale('settings.menu.metronome') }}
            </span>
          </button>
        </div>

        <!-- Swing -->
        <div
          id="swing"
          class="flex flex-row items-center justify-center space-x-4"
          @submit.prevent
        >
          <button
            class="hover:scale-125 transition-transform"
            :disabled="disableSwing(-50)"
            @click="swingIncrement(-5)"
          >
            <Chevron direction="left" :double="true" />
          </button>
          <button
            class="hover:scale-125 transition-transform"
            :disabled="disableSwing(-50)"
            @click="swingIncrement(-1)"
          >
            <Chevron direction="left" />
          </button>

          <div
            class="font-24 width-60 mr-3 space-x-1 cursor-default"
            :class="{
            }"
          >
            <span>{{ swing }}</span>
            <span>&#37;</span>
          </div>

          <button
            :class="{
              'active:scale-90 transition-transform': !disableSwing(0),
            }"
            :disabled="disableSwing(0)"
            @click="swingIncrement(0)"
          >
            <span class="sr-only">
              {{ $filters.locale('milliseconds.reset') }}
            </span>
            <span
              class="rounded-full h-5 w-5 flex items-center justify-center text-lg bg-neutral-50 hover:shadow-md dark:bg-neutral-400 dark:text-black"
              :class="{
                'hover:bg-primary hover:text-white dark:hover:bg-primary-interactive dark:hover:text-white':
                  true,
              }"
            >
              <Close classes="h-3 w-3" />
            </span>
          </button>

          <button
            class="hover:scale-125 transition-transform"
            :disabled="disableSwing(50)"
            @click="swingIncrement(1)"
          >
            <Chevron direction="right" />
          </button>
          <button
            class="hover:scale-125 transition-transform"
            :disabled="disableSwing(50)"
            @click="swingIncrement(5)"
          >
            <Chevron direction="right" :double="true" />
          </button>
        </div>

        <!-- BOTTOM -->
        <div class="relative">
          <!-- Note Options -->
          <section
            id="notes"
            class="flex flex-row justify-center pt-8 relative transition-transform z-0"
            :class="{
              'translate-x-1/4': slide < 1,
              '-translate-x-1/4': slide > 1,
              'blur-sm select-none': metronome,
            }"
          >
            <div
              v-for="(modifier, modifierName, index) in modifiers"
              :key="modifierName"
              :index="index"
              :class="scale(index)"
              class="relative w-1/4 transition-transform duration-300 ease-in-out text-center"
            >
              <div
                :class="{
                  'blur-md opacity-50 cursor-not-allowed select-none':
                    false,
                }"
              >
                <!-- Overlay -->
                <button
                  v-if="slide !== index"
                  @click.prevent="slide = index"
                  class="bg-transparent h-full w-full position absolute inset-0"
                >
                  <span class="sr-only">
                    {{ $filters.locale('milliseconds.carousel.focus') }}
                  </span>
                </button>

                <!-- Notation Type -->
                <h3 class="text-center font-semibold mb-2 relative">
                  <span>
                    {{
                      $filters.locale(`milliseconds.modifiers.${modifierName}`)
                    }}
                  </span>

                  <Shortcut
                    v-if="!metronome"
                    locale="milliseconds.shortcuts.modifier"
                    position="top"
                  />
                </h3>

                <!-- Predelay -->
                <div
                  :class="{
                    hidden: !predelay.selected,
                  }"
                  class=""
                >
                  <button
                    class="font-semibold text-primary dark:text-tertiary-container grid grid-cols-2 gap-5 mx-auto items-center rounded-md hover:bg-primary/[0.15] dark:hover:bg-tertiary-container/[0.25] w-full"
                    :class="{ 'cursor-copy': true }"
                    @click="
                      copy($event, {
                        notation: predelay.selected,
                        modifier,
                        modifierName,
                        isPredelay: true,
                      })
                    "
                  >
                    <span
                      class="font-semibold uppercase text-primary dark:text-tertiary-container text-right"
                      >{{ $filters.locale('milliseconds.pre') }}</span
                    >
                    <span class="text-left">
                      {{
                        calcTime({
                          notation: predelay.selected,
                          modifier,
                          modifierName,
                          isPredelay: true,
                        })
                      }}
                    </span>
                  </button>
                </div>

                <!-- Calcs -->
                <div
                  v-for="(value, note) of notes"
                  :key="value"
                  :class="{
                    hidden: value < predelay.selected,
                  }"
                >
                  <template v-if="value > predelay.selected">
                    <button
                      class="grid grid-cols-2 gap-5 mx-auto items-center rounded-md w-full"
                      :class="{
                        'cursor-copy hover:bg-primary/[0.15] dark:hover:bg-tertiary-container/[0.25]':
                          true,
                      }"
                      @click="
                        copy($event, {
                          notation: value,
                          modifier,
                          modifierName,
                        })
                      "
                    >
                      <span class="text-right">
                        {{ $filters.locale(note) }}
                      </span>
                      <span class="text-left">
                        {{
                          calcTime({
                            notation: value,
                            modifier,
                            modifierName,
                          })
                        }}
                      </span>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </section>

          <Transition
            enter-active-class="duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-50"
            leave-active-class="duration-150 ease-in"
            leave-from-class="opacity-50"
            leave-to-class="opacity-0"
          >
            <Alert
              v-if="showSeconds"
              message="Copying in seconds"
              type="action"
              class="absolute -bottom-[4.3rem] left-1/2 -translate-x-1/2"
            />
          </Transition>

          <!-- Metronome -->
          <MetronomeComp
            v-if="metronome"
            :tempo="tempo"
            @keydown.esc="metronome = false"
          >
            <template v-slot:close>
              <button @click.prevent="metronome = false">
                <Close classes="h-7 w-7 active:scale-90" />
                <span class="sr-only">
                  {{ $filters.locale('general.close') }}
                </span>
              </button>
            </template>
          </MetronomeComp>
        </div>
      </div>
    </div>

    <!-- Tap Tempo -->
    <TapTempo v-if="tap" @keydown.esc="showTap(false)">
      <template v-slot:close>
        <button @click.prevent="showTap(false)">
          <Close classes="h-7 w-7 active:scale-90" />
          <span class="sr-only">
            {{ $filters.locale('general.close') }}
          </span>
        </button>
      </template>
    </TapTempo>
  </section>
</template>
