<script>
import { relaunch } from '@tauri-apps/api/process'
import { resetData } from '@/utils/data'

import light from '@/assets/theme-light.jpg'
import dark from '@/assets/theme-dark.jpg'
import auto from '@/assets/theme-auto.jpg'

export default {
  data() {
    return {
      decimals: 2,
      fontsize: {
        selected: 'text-base',
        options: [
          { value: 16, text: 'settings.fonts.options.sm' },
          { value: 18, text: 'settings.fonts.options.base' },
          { value: 20, text: 'settings.fonts.options.lg' },
          { value: 22, text: 'settings.fonts.options.xl' },
        ],
      },
      language: {
        selected: 'en',
        options: [
          { value: 'en', text: 'languages.en' },
          { value: 'fr', text: 'languages.fr' },
          { value: 'es', text: 'languages.es' },
        ],
      },
      theme: {
        images: { auto, light, dark },
        selected: 'auto',
        options: [
          { value: 'light', text: 'settings.theme.light' },
          { value: 'dark', text: 'settings.theme.dark' },
          { value: 'auto', text: 'settings.theme.auto' },
        ],
      },
    }
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
    async reset() {
      await resetData('settings')
      await relaunch()
    },
    async updateSetting(key, value) {
      this.$store.dispatch('updateSetting', {
        key: 'configs',
        value: { [key]: value },
      })

      if (key === 'language') {
        localStorage.setItem('language', this.$store.getters.language)
        await relaunch()
      }
    },
  },
}
</script>

<template>
  <div>
    <!-- Theme -->
    <div class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.headings.theme') }}
        </h2>
        <p class="text-info">{{ $filters.locale('settings.info.theme') }}</p>
      </div>
      <div class="form-section-content">
        <ul class="flex flex-row gap-4">
          <li v-for="option in theme.options" :key="option.value">
            <div
              class="form-section-title flex items-center justify-start space-x-2"
            >
              <label
                :for="option.value"
                class="cursor-pointer text-center peer-target:group-checked:"
              >
                <input
                  :id="option.value"
                  :value="option.value"
                  v-model="theme.selected"
                  @input="updateSetting('theme', option.value)"
                  class="peer sr-only"
                  name="theme"
                  type="radio"
                />

                <img
                  class="peer-checks rounded-lg overflow-hidden"
                  :src="theme.images[option.value]"
                  :alt="$filters.locale(option.text)"
                />

                <span class="text-sm text-neutral-500 dark:text-neutral-200">
                  {{ $filters.locale(option.text) }}
                </span>
              </label>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Decimals -->
    <div class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.decimals.heading') }}
        </h2>
        <p class="text-info">{{ $filters.locale('settings.decimals.info') }}</p>
      </div>
      <div class="form-section-content">
        <label for="decimals" class="sr-only">
          {{ $filters.locale('settings.decimals.heading') }}
        </label>
        <input
          type="number"
          class="input text-center w-16"
          v-model.number="decimals"
          @input="updateSetting('decimals', decimals)"
          min="0"
          max="10"
        />
      </div>
    </div>

    <!-- Fonts -->
    <div class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.headings.fonts') }}
        </h2>
        <p class="text-info">{{ $filters.locale('settings.info.fonts') }}</p>
      </div>
      <div class="form-section-content">
        <label for="fontsize" class="sr-only">
          {{ $filters.locale('settings.headings.fonts') }}
        </label>
        <select
          id="fontsize"
          class="select w-40"
          name="fontsize"
          v-model="fontsize.selected"
          @change="updateSetting('fontsize', fontsize.selected)"
        >
          <option
            v-for="option in fontsize.options"
            :key="option.value"
            :value="option.value"
          >
            {{ $filters.locale(option.text) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Language -->
    <div class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.headings.language') }}
        </h2>
        <p class="text-info">{{ $filters.locale('settings.info.language') }}</p>
      </div>
      <div class="form-section-content">
        <label for="language" class="sr-only">
          {{ $filters.locale('settings.headings.language') }}
        </label>
        <select
          id="language"
          class="select w-40"
          name="language"
          v-model="language.selected"
          @change="updateSetting('language', language.selected)"
        >
          <option
            v-for="option in language.options"
            :key="option.value"
            :value="option.value"
          >
            {{ $filters.locale(option.text) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Reset Data -->
    <div class="form-section-wrapper">
      <div class="form-section-title">
        <h2 class="heading">
          {{ $filters.locale('settings.headings.reset') }}
        </h2>
        <p class="text-info">{{ $filters.locale('settings.info.reset') }}</p>
      </div>
      <div class="form-section-content">
        <ul class="flex gap-4">
          <li>
            <button
              class="btn btn-sm btn-outline-critical btn-critical"
              @click="reset()"
            >
              {{ $filters.locale('settings.headings.reset') }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
