<template>
  <div id="LoadingApp" class="flex flex-row items-center space-x-2">
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      class="animate-spin text-black dark:text-white"
      :class="[classIcon]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span v-if="showText" :class="classText">
      {{ $filters.locale(label) }} ...
    </span>
  </div>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    classIcon: {
      type: String,
      default: 'h-5 w-5',
    },
    classText: {
      type: String,
      default: 'text-sm',
    },
    showText: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      default: 'general.loading',
    },
  },
}
</script>
