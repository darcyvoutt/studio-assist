<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    Calculator: defineAsyncComponent(() => import('@/icons/Calculator.vue')),
    Cog: defineAsyncComponent(() => import('@/icons/Cog.vue')),
    Files: defineAsyncComponent(() => import('@/icons/File.vue')),
    PlayCircle: defineAsyncComponent(() => import('@/icons/PlayCircle.vue')),
    Scales: defineAsyncComponent(() => import('@/icons/Scale.vue')),
  },
  data() {
    return {
      menu: [
        {
          id: 'milliseconds',
          icon: 'Calculator',
          label: 'menu.calculator',
        },
        {
          id: 'scales',
          icon: 'Scales',
          label: 'menu.scales',
        },
        {
          id: 'files',
          icon: 'Files',
          label: 'menu.files',
        },
        {
          id: 'reference',
          icon: 'PlayCircle',
          label: 'menu.reference',
        },
        {
          id: 'configs',
          icon: 'Cog',
          label: 'menu.settings',
        },
      ],
    }
  },
  computed: {
    show() {
      return this.$store.state.menu_show
    },
  },
  methods: {
    activeTab(tab) {
      return tab === this.$store.state.settings.section
    },
    setTab(tab) {
      this.$store.dispatch('updateSetting', { key: 'section', value: tab })
    },
  },
}
</script>

<template>
  <nav
    class="fixed flex items-center h-screen px-3 lg:px-7 z-40 transition-transform ease-linear duration-150"
    :class="{ '-translate-x-full': !show }"
    aria-label="{{ $filters.locale('menu.title') }}"
  >
    <ul
      class="card py-6 px-3 rounded-lg flex flex-col items-center space-y-[1.1rem]"
      role="menubar"
      aria-label="{{ $filters.locale('menu.title') }}"
    >
      <li
        class="flex flex-col items-center justify-center"
        v-for="(item, index) in menu"
        :key="index"
        role="none"
      >
        <button
          role="menuitem"
          :aria-label="$filters.locale(item.label)"
          @click.prevent="setTab(item.id)"
          class="group rounded-md p-1 relative z-0"
        >
          <div
            class="hidden group-hover:block absolute left-[3.4rem] top-0 py-1.5 px-3 min-w-12 z-10 card rounded-lg after:card after:h-3 after:w-3 after:rotate-45 after:absolute after:-left-[.4rem] after:top-1/2 after:-translate-y-1/2 after:-z-10 after:border-r-0 after:border-t-0"
          >
            {{ $filters.locale(item.label) }}
          </div>

          <component
            v-bind:is="item.icon"
            classes="h-6 w-6 transition-all hover:scale-[1.15]"
            :class="activeTab(item.id) ? 'text-primary dark:text-red-400' : ''"
          />
        </button>
      </li>
    </ul>
  </nav>
</template>
