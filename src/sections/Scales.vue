<script>
import { defineAsyncComponent } from 'vue'

// Modules
import { Key, Note, Scale } from 'tonal'

// Utils
import { capitalizeAll, flatToString } from '@/utils/convert'
import { keys } from '@/utils/keys'

export default {
  name: 'Scales',
  components: {
    Chevron: defineAsyncComponent(() => import('@/icons/Chevron.vue')),
    Info: defineAsyncComponent(() => import('@/icons/Info.vue')),
    Octaves: defineAsyncComponent(() =>
      import('@/components/piano/Octaves.vue')
    ),
    Refresh: defineAsyncComponent(() => import('@/icons/Refresh.vue')),
  },
  data() {
    return {
      noteNames: keys.show,
      scaleNames: null,
      // Set by state on load
      scale: {
        key: {
          value: 'C',
          text: 'C',
        },
        name: {
          value: 'major',
          text: 'Major',
        },
        octave: '5',
      },
      results: {
        keys: null,
        names: null,
      },
      show: {
        keys: false,
        names: false,
      },
    }
  },
  computed: {
    noteFrequencies() {
      const notes = {}
      this.scaleKeysCleaned.forEach((note) => {
        Object.assign(notes, {
          [`${note}`]: Note.freq(`${note}${this.scale.octave}`).toFixed(2),
        })
      })
      return notes
    },
    relative() {
      if (this.scale.name.value === undefined) return
      const isMajor = this.scale.name.value.includes('major')
      const relativeKey = isMajor
        ? Key.majorKey(this.scale.key.value).minorRelative
        : Key.minorKey(this.scale.key.value).relativeMajor
      const scale = isMajor ? 'minor' : 'major' // No locale needed, not user facing

      return {
        key: {
          value: relativeKey,
          text: relativeKey,
        },
        name: {
          value: scale,
          text: capitalizeAll(scale),
        },
      }
    },
    scaleKeys() {
      return Scale.get(
        `${this.scale.key.value}${this.scale.octave} ${this.scale.name.value}`
      ).notes
    },
    scaleKeysCleaned() {
      return this.scaleKeys.map((key) => key.replace(/[0-9]/g, ''))
    },
    selectedKey() {
      return this.scale.key
    },
    selectedName() {
      return this.scale.name
    },
    selectedOctave() {
      return this.scale.octave
    },
  },
  watch: {
    selectedKey(key) {
      this.updateSettings({ key })
    },
    selectedName(name) {
      this.updateSettings({ name })
    },
    selectedOctave(octave) {
      this.updateSettings({ octave })
    },
  },
  created() {
    this.init()
  },
  methods: {
    init() {
      this.scale = { ...this.$store.state.settings.scales }
      this.setScaleNames()
      this.searchReset()
    },
    // FOCUS BASED
    focusInput(key) {
      this.$refs[key].focus()
    },
    findFocusChild(key, find = 'button') {
      this.$refs[key].querySelector(find).focus()
    },
    findFocusSibling(el, find = 'button') {
      const parent = el.target.parentElement
      const prevEl = parent.previousElementSibling
      const nextEl = parent.nextElementSibling

      // Prev sibling
      if (el.key === 'ArrowUp' && prevEl !== null)
        prevEl.querySelector(find).focus()
      if (el.key === 'ArrowUp' && prevEl === null)
        parent.parentElement.lastChild.querySelector(find).focus()

      // Next sibling
      if (el.key === 'ArrowDown' && nextEl !== null)
        nextEl.querySelector(find).focus()
      if (el.key === 'ArrowDown' && nextEl === null)
        parent.parentElement.firstChild.querySelector(find).focus()
    },
    focus(key) {
      Object.keys(this.show).forEach((item) => (this.show[item] = false))
      this.show[key] = true
    },
    hide(event, key) {
      if (event.relatedTarget === null || event.relatedTarget === undefined) {
        this.show[key] = false
        document.activeElement.blur()
      }
    },
    search(event, array, key) {
      const term = event.target.value.toLowerCase()
      const result = [...array].filter((item) => {
        return flatToString(item.value.toLowerCase()).includes(term)
      })
      this.results[key] = result
    },
    searchReset() {
      this.results.keys = keys.show
      this.results.names = this.scaleNames
    },
    setScaleNames() {
      const options = []
      const scales = Scale.names().sort()

      // Remove Major
      scales.splice(scales.indexOf('major'), 1)
      scales.splice(scales.indexOf('minor'), 1)

      // Add Back Major and Minor
      scales.unshift('minor')
      scales.unshift('major')

      // Build options object
      scales.forEach((scale) => {
        options.push({
          value: scale,
          text: capitalizeAll(scale),
        })
      })

      this.scaleNames = options
    },
    toggleRelative() {
      this.scale.key = this.relative.key
      this.scale.name = this.relative.name
    },
    trialKeys(key) {
      const availableKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      return this.trial && !availableKeys.includes(key)
    },
    trialScales(scale) {
      return this.trial && scale !== 'major'
    },
    update(item, key, hideKey) {
      this.scale[key] = item
      this.show[hideKey] = false
      this.$refs[`${hideKey}-input`].value = ''
      this.searchReset()
    },
    updateSettings(property) {
      if (typeof property !== 'object') return

      this.$store.dispatch('updateSetting', {
        key: 'scales',
        value: property,
      })
    },
  },
}
</script>

<template>
  <section
    id="Scales"
    class="w-screen h-screen flex items-center justify-center"
  >
    <div>
      <!-- Title -->
      <div class="flex justify-center items-baseline gap-2 mb-6">
        <h1 class="title text-center">
          {{ $filters.locale('scales.title') }}
        </h1>
        <div class="relative">
          <Info class="peer cursor-help" />
          <div class="hidden peer-hover:flex info-popover">
            <div>{{ $filters.locale('scales.info') }}</div>
            <div v-if="trial" class="font-semibold">
              {{ $filters.locale('scales.upgrade') }}
            </div>
          </div>
        </div>
      </div>

      <div class="w-4/6 mx-auto">
        <form
          class="flex items-center justify-center gap-x-4 mb-4"
          name="scalesInput"
          @submit.prevent
        >
          <!-- Scale Key -->
          <fieldset ref="keyFieldset" class="relative">
            <div class="relative">
              <input
                type="text"
                ref="keys-input"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                class="input dropdown-input w-56 peer"
                @blur="hide($event, 'keys')"
                @focus="focus('keys')"
                @input="search($event, noteNames, 'keys')"
                @keydown.down.prevent="findFocusChild('keys')"
                @keydown.right.prevent="focusInput('names-input')"
                @keypress.esc.prevent="hide($event, 'keys')"
                :placeholder="scale.key.text"
              />

              <div
                class="absolute top-0 translate-y-1/2 right-4 transition-transform duration-300 peer-focus:-rotate-180"
              >
                <Chevron direction="down" />
              </div>
            </div>

            <ul v-if="show.keys" ref="keys" class="dropdown-results">
              <li
                class="w-full select-none hover:bg-primary-interactive focus:bg-primary-interactive"
                v-for="item in results.keys"
                :key="item.value"
              >
                <button
                  class="dropdown-results-item"
                  @blur="hide($event, 'keys')"
                  @mousedown="update(item, 'key', 'keys')"
                  @keydown.enter.prevent="update(item, 'key', 'keys')"
                  @keydown.up.prevent="findFocusSibling($event)"
                  @keydown.down.prevent="findFocusSibling($event)"
                  @keydown.right.prevent="focusInput('names-input')"
                  @keydown.esc.prevent="focusInput('keys-input')"
                  :disabled="trialKeys(item.value)"
                >
                  {{ item.text }}
                </button>
              </li>
            </ul>
          </fieldset>

          <!-- Scale Name -->
          <fieldset ref="nameFieldset" class="relative">
            <div class="relative">
              <input
                type="text"
                ref="names-input"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                class="input dropdown-input w-56 peer"
                @blur="hide($event, 'names')"
                @focus="focus('names')"
                @input="search($event, scaleNames, 'names')"
                @keydown.down.prevent="findFocusChild('names')"
                @keydown.left.prevent="focusInput('keys-input')"
                :placeholder="scale.name.text"
              />

              <div
                class="absolute top-0 translate-y-1/2 right-4 transition-transform duration-300 peer-focus:-rotate-180"
              >
                <Chevron direction="down" />
              </div>
            </div>

            <ul v-if="show.names" ref="names" class="dropdown-results">
              <li
                class="w-full select-none hover:bg-primary-interactive focus:bg-primary-interactive"
                v-for="item in results.names"
                :key="item.value"
              >
                <button
                  class="dropdown-results-item"
                  @blur="hide($event, 'names')"
                  @mousedown="update(item, 'name', 'names')"
                  @keydown.enter.prevent="update(item, 'name', 'names')"
                  @keydown.up.prevent="findFocusSibling($event)"
                  @keydown.down.prevent="findFocusSibling($event)"
                  @keydown.left.prevent="focusInput('keys-input')"
                  @keydown.esc.prevent="focusInput('names-input')"
                  :disabled="trialScales(item.value)"
                >
                  {{ item.text }}
                </button>
              </li>
            </ul>
          </fieldset>

          <!-- Relative Toggle -->
          <fieldset>
            <button
              id="toggleRelative"
              class="btn py-2.5 relative group"
              @click="toggleRelative()"
              :disabled="trial"
            >
              <span
                class="transition-transform duration-300 ease-in-out"
                :class="{ 'rotate-180': scale.name.value === 'minor' }"
              >
                <Refresh />
              </span>
              <span class="tooltip tooltip-top">
                <span class="sr-only">
                  {{
                    $filters.locale('scales.relative', {
                      scale: relative.name.text,
                    })
                  }}
                </span>
                <span aria-hidden>{{ relative.name.text }}</span>
              </span>
            </button>
          </fieldset>
        </form>

        <!-- Octave -->
        <div class="mb-8">
          <label for="octave" class="py-2 block">
            {{ $filters.locale('scales.octave') }}:
            <span class="font-bold">{{ scale.octave }}</span>
          </label>
          <input
            id="octave"
            v-model="scale.octave"
            list="tickmarks"
            name="octave"
            type="range"
            min="0"
            max="11"
            step="1"
            class="range"
          />
          <div class="range-ticks-container">
            <div v-for="num in 12" :key="num" class="range-ticks">
              {{ num - 1 }}
            </div>
          </div>
        </div>
      </div>

      <div class="h-[22rem]">
        <Octaves :scale="scaleKeysCleaned" :frequencies="noteFrequencies" />
      </div>
    </div>
  </section>
</template>
