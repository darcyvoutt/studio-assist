<script>
import { defineAsyncComponent } from 'vue'

// Utilities
import { octaves } from '@/utils/octaves'

export default {
  components: {
    Key: defineAsyncComponent(() => import('@/components/piano/Key.vue')),
  },
  props: {
    frequencies: {
      type: Object,
      default: () => {
        return {}
      },
    },
    scale: {
      type: Array,
      default: () => {
        return []
      },
    },
  },
  computed: {
    keys() {
      return octaves(this.frequencies)
    },
  },
}
</script>

<template>
  <div id="Piano" class="h-full z-0">
    <div ref="piano" class="piano">
      <template v-for="(key, index) in keys" :key="index">
        <Key :note="key" :scale="scale" />
      </template>
    </div>
  </div>
</template>
