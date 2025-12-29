<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    AppLoading: defineAsyncComponent(() =>
      import('@/components/AppLoading.vue')
    ),
    Configs: defineAsyncComponent(() => import('@/sections/Configs.vue')),
    Files: defineAsyncComponent(() => import('@/sections/Files.vue')),
    Keyboard: defineAsyncComponent(() => import('@/icons/Keyboard.vue')),
    Menu: defineAsyncComponent(() => import('@/components/Menu.vue')),
    Milliseconds: defineAsyncComponent(() =>
      import('@/sections/Milliseconds.vue')
    ),
    Notifications: defineAsyncComponent(() =>
      import('@/components/Notifications.vue')
    ),
    Reference: defineAsyncComponent(() => import('@/sections/Reference.vue')),
    Scales: defineAsyncComponent(() => import('@/sections/Scales.vue')),
  },
  data() {
    return {

    }
  },
  computed: {
    appReady() {
      return this.$store.state.initialized
    },
    online() {
      return this.$store.state.online
    },
    showShortcuts() {
      return this.$store.state.shortcuts
    },
  },
  beforeCreate() {
    this.$store.dispatch('initSettings')
  },
  mounted() {
    this.setOnlineStatus()
  },
  methods: {
    section(section) {
      if (!this.appReady) return
      return this.$store.state.settings.section === section
    },
    setOnlineStatus() {
      this.$store.commit('setOnlineStatus')
      window.addEventListener('online', () =>
        this.$store.commit('setOnlineStatus')
      )
      window.addEventListener('offline', () =>
        this.$store.commit('setOnlineStatus')
      )
    },
    toggleShortcuts() {
      this.$store.commit('toggleShortcuts')
    },
  },
}
</script>

<template>
  <AppLoading v-if="!appReady" label="general.loading" />

  <header data-tauri-drag-region class="faux-header" />

  <Menu />

  <main class="h-screen flex items-center pl-20 lg:pl-28 pr-8 lg:pr-16">
    <Configs v-if="section('configs')" />
    <Files v-if="section('files')" />
    <Milliseconds v-if="section('milliseconds')" />
    <Scales v-if="section('scales')" />
    <Reference v-if="section('reference')" />
  </main>

  <!-- Toggle Shortcuts -->
  <div class="fixed bottom-6 right-6 z-10">
    <div class="relative group">
      <button
        class="btn-circle bg-primary-interactive dark:bg-primary-interactive/[0.6] p-2 rounded-full opacity-40 hover:opacity-100 transition-opacity duration-200"
        @click="toggleShortcuts()"
      >
        <span class="sr-only">{{ $filters.locale('shortcuts.toggle') }}</span>
        <Keyboard classes="h-5 w-5 fill-white" />
      </button>

      <span
        class="tooltip tooltip-left text-sm font-semibold w-20 text-center"
        :class="{ 'opacity-100': showShortcuts }"
      >
        {{ $filters.locale('shortcuts.shortcut') }}
      </span>
    </div>
  </div>
  <Notifications />
</template>
