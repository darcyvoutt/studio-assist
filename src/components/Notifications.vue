<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    Close: defineAsyncComponent(() => import('@/icons/Close.vue')),
  },
  computed: {
    notifications() {
      return this.$store.state.notifications
    },
  },
  methods: {
    remove(key) {
      this.$store.commit('removeNotification', key)
    },
  },
}
</script>

<template>
  <aside id="Notifications" class="absolute top-16 right-6 z-50">
    <div class="flex flex-col space-y-2.5">
      <div
        class="notification"
        v-for="(notification, key) in notifications"
        :key="key"
      >
        <span class="leading-snug">{{ notification }}</span>

        <button @click="remove(key)" class="pt-0.5">
          <Close classes="h-5 w-5 text-neutral-300 hover:text-black" />
        </button>
      </div>
    </div>
  </aside>
</template>
