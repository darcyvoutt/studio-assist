<template>
  <span :class="classes">
    <svg
      version="1.1"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <circle id="b" cx="206" cy="206" r="206" />
        <filter id="e" x="-4.5%" y="-3.5%" width="109%" height="109%">
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="0.5"
            result="shadowSpreadOuter1"
          />
          <feOffset
            dx="0"
            dy="4"
            in="shadowSpreadOuter1"
            result="shadowOffsetOuter1"
          />
          <feGaussianBlur
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
            stdDeviation="5"
          />
          <feColorMatrix
            in="shadowBlurOuter1"
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.3 0"
          />
        </filter>
        <linearGradient
          id="c"
          x1="-1.1671%"
          x2="87.284%"
          y1="75.978%"
          y2="28.638%"
        >
          <stop stop-color="#212527" offset="0" />
          <stop stop-color="#212527" offset=".16863" />
          <stop stop-color="#fff" offset=".52917" />
          <stop stop-color="#212527" offset="1" />
        </linearGradient>
        <path
          id="a"
          d="m143.09 272.72c-27.348 0-44.836-13.05-52.091-32.253l25.673-14.915c4.651 10.813 12.651 18.084 27.348 18.084 14.139 0 17.674-5.593 17.674-10.627 0-8.0167-7.4416-11.186-26.976-16.593-19.348-5.4066-38.324-14.728-38.324-39.71 0-25.169 21.209-39.71 43.719-39.71 21.395 0 38.138 10.254 47.626 29.457l-25.115 14.728c-4.465-9.3217-10.604-15.101-22.511-15.101-9.302 0-13.953 4.6609-13.953 9.881 0 5.9659 3.1627 10.067 23.441 16.22 19.72 5.9659 41.859 12.864 41.859 40.456 0 25.169-20.092 40.083-48.37 40.083zm145.42-2.6101-6.5114-20.508h-48.37l-6.5114 20.508h-32.557l44.277-130.5h37.952l44.277 130.5h-32.557zm-45.952-48.473h30.51l-15.255-47.914-15.255 47.914z"
        />
        <filter id="d" x="-3.3%" y="-7.7%" width="109.1%" height="115.5%">
          <feOffset
            dx="3"
            dy="0"
            in="SourceAlpha"
            result="shadowOffsetOuter1"
          />
          <feGaussianBlur
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
            stdDeviation="3"
          />
          <feColorMatrix
            in="shadowBlurOuter1"
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.196501359 0"
          />
        </filter>
      </defs>
      <g fill="none" fill-rule="evenodd">
        <g transform="translate(50 51)">
          <use fill="black" filter="url(#e)" xlink:href="#b" />
          <use fill="#212527" fill-rule="evenodd" xlink:href="#b" />
          <path
            d="m340 272c5.4719 0 10-4.5281 10-10s-4.5281-10-10-10-10 4.5281-10 10 4.5281 10 10 10z"
            fill="#EB4444"
            fill-rule="nonzero"
          />
          <use fill="black" filter="url(#d)" xlink:href="#a" />
          <use fill="url(#c)" fill-rule="evenodd" xlink:href="#a" />
        </g>
      </g>
    </svg>
  </span>
</template>

<script>
export default {
  props: {
    classes: {
      type: String,
      default: 'h-32 w-32',
    },
  },
}
</script>
