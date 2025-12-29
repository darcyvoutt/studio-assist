<template>
  <div v-if="show">
    <!-- Modal -->
    <div class="modal" aria-modal="true" role="dialog">
      <div class="modal-container">
        <!-- Overlay -->
        <div class="modal-overlay" aria-hidden="true" @click="show = false" />

        <!-- Content Container -->
        <div class="modal-content">
          <!-- Content -->
          <slot name="content"></slot>

          <!-- Close Button -->
          <button class="modal-close" @click="show = false">
            <span class="sr-only">
              {{ $filters.locale('general.close') }}
            </span>
            <Close />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    Close: defineAsyncComponent(() => import('@/icons/Close.vue')),
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
}
</script>
