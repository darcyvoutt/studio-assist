<template>
  <span>
    <svg
      v-if="!double"
      aria-hidden
      :class="[classes, orientation()]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>

    <svg
      v-if="double"
      aria-hidden
      :class="[classes, orientation()]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M13 5l7 7-7 7M5 5l7 7-7 7"
      />
    </svg>
  </span>
</template>

<script>
export default {
  name: "Chevron",
  props: {
    classes: {
      type: String,
      default: "h-5 w-5",
    },
    direction: {
      type: String,
      default: "right",
    },
    double: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    orientation() {
      if (this.direction === "up") return "-rotate-90";
      if (this.direction === "down") return "rotate-90";
      if (this.direction === "left") return "-rotate-180";
      return "";
    },
  },
};
</script>
