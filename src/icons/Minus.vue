<template>
  <span>
    <svg
      aria-hidden
      :class="classes"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
    </svg>
  </span>
</template>

<script>
export default {
  props: {
    classes: {
      type: String,
      default: 'h-5 w-5',
    },
  },
}
</script>
