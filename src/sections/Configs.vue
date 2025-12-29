<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    Preferences: defineAsyncComponent(() =>
      import('@/components/configs/Preferences.vue')
    ),
    KeyDetection: defineAsyncComponent(() =>
      import('@/components/configs/KeyDetection.vue')
    ),
  },
  data() {
    return {
      section: 'preferences',
      menu: ['preferences', 'key_detection'],
    }
  },
}
</script>

<template>
  <section class="w-full flex justify-center">
    <h1 class="sr-only">{{ $filters.locale('settings.headings.title') }}</h1>

    <div class="grid grid-cols-12 gap-x-16 w-full items-center">
      <!-- Menu -->
      <div class="col-span-3">
        <ul class="flex flex-col gap-y-2 configs-menu">
          <li v-for="item in menu" :key="item">
            <button
              class="btn-configs"
              :class="{ 'btn-configs-active': section === item }"
              @click="section = item"
            >
              {{ $filters.locale(`settings.menu.${item}`) }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Sections -->
      <div class="col-span-9">
        <Preferences v-if="section === 'preferences'" />
        <KeyDetection v-if="section === 'key_detection'" />
      </div>
    </div>
  </section>
</template>
