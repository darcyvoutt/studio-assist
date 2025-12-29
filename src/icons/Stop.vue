<template>
  <span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      :class="classes"
      aria-hidden
    >
      <path
        fill-rule="evenodd"
        d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
        clip-rule="evenodd"
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
