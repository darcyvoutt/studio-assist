<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    Loading: defineAsyncComponent(() => import('@/icons/Loading.vue')),
  },
  props: {
    label: {
      type: String,
      default: 'general.loading',
    },
  },
}
</script>

<template>
  <section
    class="absolute flex items-center justify-center h-screen w-screen z-50 scheme overflow-none"
  >
    <Loading :label="label" />
  </section>
</template>
