<template>
  <span>
    <svg
      v-if="type === ''"
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
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>

    <svg
      v-if="type === 'circle'"
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
        d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </span>
</template>

<script>
export default {
  name: "Arrow",
  props: {
    classes: {
      type: String,
      default: "h-5 w-5",
    },
    direction: {
      type: String,
      default: "right",
    },
    type: {
      type: String,
      default: "",
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
