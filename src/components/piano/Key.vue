<script>
// Tauri APIs
import { writeText } from '@tauri-apps/api/clipboard'

// Utils
import { calcFreq, stringToFlat, trimDecimals } from '@/utils/convert'
import { locale } from '@/utils/locale'

export default {
  props: {
    note: {
      type: Object,
      default: () => {
        return {
          letters: ['D'],
          frequency: 440.0,
          children: {
            letters: ['C#', 'Db'],
            frequency: 550.0,
          },
        }
      },
    },
    scale: {
      type: Array,
      default: () => {
        return ['C', 'D', 'E']
      },
    },
  },
  computed: {
    currentScale() {
      return this.$store.state.settings.scales
    },
    trial() {
      return this.$store.getters.trial
    },
  },
  methods: {
    async copy(note) {
      if (this.trial || note.frequency === 0) return
      const decimals = this.$store.state.settings.configs.decimals

      // Copy to clipboard
      await writeText(trimDecimals(note.frequency, decimals))

      // Sent notification
      const key = stringToFlat(note.letters.toString().replace(',', ' / '))
      this.$store.dispatch('notify', locale('scales.copied', { key }))
    },
    frequency(number) {
      const freq = parseFloat(number)
      return freq > 1000 ? calcFreq(freq, true) : calcFreq(freq)
    },
    keyCheck(notes = []) {
      return notes.find((key) => this.scale.includes(key))
    },
    label(notes) {
      let label = ''
      notes.forEach((note, index) => {
        if (note.includes('##')) return
        label += index > 0 ? ` / ${stringToFlat(note)}` : stringToFlat(note)
      })
      return label
    },
    isCurrentScale(notes) {
      return notes.includes(this.currentScale.key.value)
    },
  },
}
</script>

<template>
  <div
    class="piano-key piano-key-white"
    :class="{ 'piano-key-hightlighted': keyCheck(note.letters) }"
  >
    <!-- White Key Info -->
    <button
      @click="copy(note)"
      :disabled="note.frequency === 0"
      :class="{
        'cursor-copy': keyCheck(note.letters) && !trial,
        'cursor-not-allowed': trial,
      }"
      class="flex flex-col items-center select-none peer"
      tabindex="-1"
    >
      <div v-if="isCurrentScale(note.letters)" class="piano-key-scale"></div>
      <span class="font-extrabold">{{ label(note.letters) }}</span>
      <div class="font-extralight" v-if="note.frequency">
        {{ frequency(note.frequency) }}
      </div>
    </button>

    <!-- Range Highlight -->
    <div
      v-if="note.frequency && !trial"
      class="piano-key-range peer-hover:opacity-100"
    >
      <span>
        {{ note.range.name }}
      </span>
    </div>

    <!-- Black Key -->
    <div
      v-if="note.children.letters.length > 0"
      class="piano-key piano-key-black"
      :class="{ 'piano-key-hightlighted': keyCheck(note.children.letters) }"
    >
      <!-- Black Key Info -->
      <button
        @click="copy(note.children)"
        :disabled="note.children.frequency === 0"
        :class="{
          'cursor-copy': keyCheck(note.children.letters) && !trial,
          'cursor-not-allowed': trial,
        }"
        class="flex flex-col items-center select-none peer"
        tabindex="-1"
      >
        <div
          v-if="isCurrentScale(note.children.letters)"
          class="piano-key-scale"
        ></div>
        <div class="font-extrabold">{{ label(note.children.letters) }}</div>
        <div class="font-extralight" v-if="note.children.frequency">
          {{ frequency(note.children.frequency) }}
        </div>
      </button>

      <!-- Range Highlight -->
      <div
        v-if="note.children.frequency && !trial"
        class="piano-key-range peer-hover:opacity-100"
      >
        <span>
          {{ note.children.range.name }}
        </span>
      </div>
    </div>
  </div>
</template>
