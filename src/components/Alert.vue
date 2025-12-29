<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    Exclamation: defineAsyncComponent(() => import('@/icons/Exclamation.vue')),
  },
  name: 'Alert',
  props: {
    message: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'info',
    },
  },
  computed: {
    showAlert() {
      return this.message !== null && this.message.length > 0
    },
  },
}
</script>

<template>
  <div id="Alert" v-if="showAlert">
    <div
      :class="{
        'alert-info': type === 'info',
        'alert-action': type === 'action',
        'alert-critical': type === 'critical',
        'alert-warning': type === 'warning',
      }"
    >
      <Exclamation
        v-if="type !== 'info' && type !== 'action'"
        classes="h-5 w-5 mr-2"
      />
      <span>{{ message }}</span>
    </div>
  </div>
</template>
