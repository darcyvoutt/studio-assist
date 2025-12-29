<template>
  <span
    v-if="locale.length > 0"
    class="shortcut"
    :class="[positionClass(), show ? 'block' : '']"
  >
    {{ $filters.locale(locale) }}
  </span>
</template>

<script>
export default {
  props: {
    position: {
      type: String,
      default: 'top',
    },
    locale: {
      type: String,
      default: '',
    },
  },
  computed: {
    show() {
      return this.$store.state.shortcuts
    },
  },
  methods: {
    positionClass() {
      let className = ''
      switch (this.position) {
        case 'top':
          className = 'shortcut-top'
          break
        case 'right':
          className = 'shortcut-right'
          break
        case 'bottom':
          className = 'shortcut-bottom'
          break
        case 'left':
          className = 'shortcut-left'
          break
        default:
          className = 'shortcut-top'
          break
      }
      return className
    },
  },
}
</script>
