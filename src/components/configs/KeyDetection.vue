<template>
  <template v-if="trial">
    <h2 class="subtitle flex items-center justify-center h-full w-full">
      {{ $filters.locale('general.preview_long') }}
    </h2>
  </template>
  <template v-else>
    <!-- Profile -->
    <div v-if="isDev" class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.key_detection.profile.heading') }}
        </h2>
        <p class="text-info">
          {{ $filters.locale('settings.key_detection.profile.info') }}
        </p>
      </div>
      <div class="form-section-content">
        <label for="profile" class="sr-only">
          {{ $filters.locale('settings.key_detection.profile.heading') }}
        </label>
        <select
          id="profile"
          class="select"
          name="profile"
          v-model="profile"
          @change="updateSetting('profile', profile)"
        >
          <option
            v-for="profile in profiles"
            :key="profile.value"
            :value="profile.value"
          >
            {{ profile.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Frequency -->
    <div class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.key_detection.frequency.heading') }}
        </h2>
        <p class="text-info">
          {{ $filters.locale('settings.key_detection.frequency.info') }}
        </p>
      </div>
      <div class="form-section-content">
        <div class="flex items-center gap-x-6">
          <div class="flex gap-x-2">
            <div class="flex flex-col items-center gap-1">
              <input
                id="minFreq"
                type="number"
                class="input text-center w-20"
                v-model.number="minFreq"
                @input="updateSetting('minFreq', minFreq)"
                min="0"
                max="24000"
              />
              <label
                for="minFreq"
                class="text-xs text-neutral-500 dark:text-neutral-400"
              >
                {{ $filters.locale('settings.key_detection.frequency.min') }}
              </label>
            </div>
            <span class="text-xs opacity-60 font-medium pt-3">
              {{ $filters.locale('general.frequencies.hertz') }}
            </span>
          </div>
          <div class="flex gap-x-2">
            <div class="flex flex-col items-center gap-1">
              <input
                id="maxFreq"
                type="number"
                class="input text-center w-20"
                v-model.number="maxFreq"
                @input="updateSetting('maxFreq', maxFreq)"
                min="0"
                max="24000"
              />
              <label
                for="maxFreq"
                class="text-xs text-neutral-500 dark:text-neutral-400"
              >
                {{ $filters.locale('settings.key_detection.frequency.max') }}
              </label>
            </div>
            <span class="text-xs opacity-60 font-medium pt-3">
              {{ $filters.locale('general.frequencies.kilohertz') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tuning -->
    <div class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.key_detection.tuning.heading') }}
        </h2>
        <p class="text-info">
          {{ $filters.locale('settings.key_detection.tuning.info') }}
        </p>
      </div>
      <div class="form-section-content">
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-2">
            <input
              id="autoTuning"
              type="checkbox"
              class="checkbox"
              v-model="autoTuning"
              @change="updateSetting('autoTuning', autoTuning)"
            />
            <label for="autoTuning" class="cursor-pointer select-none shrink-0">
              {{ $filters.locale('settings.key_detection.auto_tuning.label') }}
            </label>
          </div>
          <div class="flex items-center gap-x-2">
            <label for="tuning" class="sr-only">
              {{ $filters.locale('settings.key_detection.tuning.heading') }}
            </label>
            <input
              id="tuning"
              type="number"
              class="input text-center w-20"
              v-model.number="tuning"
              @input="updateSetting('tuning', tuning)"
              :disabled="autoTuning"
              min="0"
              max="1000"
            />
            <span class="text-xs opacity-60 font-medium">
              {{ $filters.locale('general.frequencies.hertz') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script>
export default {
  data() {
    return {
      autoTuning: true,
      minFreq: 32,
      maxFreq: 7902,
      profile: 'bgate',
      tuning: 440,
      profiles: [
        { name: 'Bgate (Default)', value: 'bgate' },
        { name: 'Braw', value: 'braw' },
        { name: 'Diatonic', value: 'diatonic' },
        { name: 'EDMA (Enhanced Diatonic Major)', value: 'edma' },
        { name: 'EDMM (Enhanced Diatonic Major-Minor)', value: 'edmm' },
        { name: 'Faraldo', value: 'faraldo' },
        { name: 'Gomez', value: 'gomez' },
        { name: 'Krumhansl', value: 'krumhansl' },
        { name: 'Noland', value: 'noland' },
        { name: 'Pentatonic', value: 'pentatonic' },
        { name: 'Shaath', value: 'shaath' },
        { name: 'Temperley', value: 'temperley' },
        { name: 'Temperley2005', value: 'temperley2005' },
        {
          name: 'THPCP (Tonal Hierarchical Pitch Class Profile)',
          value: 'thpcp',
        },
        { name: 'TonicTriad', value: 'tonictriad' },
        { name: 'Weichai', value: 'weichai' },
      ],
    }
  },
  computed: {
    trial() {
      return this.$store.getters.trial
    },
    isDev() {
      return import.meta.env.DEV
    },
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      const configs = { ...this.$store.state.settings.configs }
      Object.keys(configs).forEach((key) => {
        if (typeof this[key] === 'object') this[key].selected = configs[key]
        else this[key] = configs[key]
      })
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
