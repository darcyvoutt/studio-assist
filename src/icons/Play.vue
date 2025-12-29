<template>
  <span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      :class="classes"
      aria-hidden
    >
      <path
        d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
      />
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
