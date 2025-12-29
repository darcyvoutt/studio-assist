// Node Modules
import { createStore } from 'vuex'

// Utility functions
import { getData, saveData, resetData } from '@/utils/data'
import { structSettings } from '@/struct'
import { updateDom } from '@/utils/init'

// Create a new store instance.
export const store = createStore({
  state() {
    return {
      initialized: false,
      menu_show: true,
      notifications: {},
      online: false,
      shortcuts: false,
      settings: structSettings,
    }
  },
  getters: {
    audioConfigs(state) {
      return {
        minFreq: state.settings.configs.minFreq,
        maxFreq: state.settings.configs.maxFreq,
        profile: state.settings.configs.profile,
        tuning: state.settings.configs.tuning,
        autoTuning: state.settings.configs.autoTuning,
      }
    },
    fileHistory(state) {
      return state.settings.files.history
    },
  },
  mutations: {
    initComplete(state) {
      state.initialized = true
    },
    removeNotification(state, id) {
      delete state.notifications[id]
    },
    saveSettings(state, payload) {
      if (typeof payload !== 'object') return
      if (state.settings[payload.key] === undefined)
        Object.assign(state.settings, { [`${payload.key}`]: {} })
      state.settings[payload.key] = payload.value
    },
    setDom(state) {
      updateDom({
        fontsize: state.settings.configs.fontsize,
        language: state.settings.configs.language,
        theme: state.settings.configs.theme,
      })
    },
    setProperty(state, payload) {
      state[payload.key] = payload.value
    },
    setMenu(state, boolean) {
      state.menu_show = boolean
    },
    setNotification(state, payload) {
      Object.assign(state.notifications, { [payload.id]: payload.message })
    },
    setOnlineStatus(state) {
      state.online = window.navigator.onLine
    },
    toggleShortcuts(state) {
      state.shortcuts = !state.shortcuts
    },
  },
  actions: {
    async initSettings(context) {
      let settings = await getData('settings')
      // Reset data if corrupted
      if (
        !settings ||
        settings === null ||
        Object.keys(settings).length === 0
      ) {
        await resetData('settings')
        settings = await getData('settings')
      }

      // Migration: ensure app never boots into the old register flow
      if (settings && settings.section === 'register') {
        settings.section = 'milliseconds'
        await saveData(settings, 'settings')
      }

      context.commit('setProperty', { key: 'settings', value: settings })
      context.commit('setDom')
      context.commit('initComplete')
      return
    },
    notify(context, message) {
      const id = new Date().getTime()
      context.commit('setNotification', { id, message })
      setTimeout(() => {
        context.commit('removeNotification', id)
      }, 3000)
    },
    async updateSetting(context, payload) {
      let value = null

      // Get existing values and update object
      if (typeof payload.value === 'string') {
        value = payload.value
      } else {
        value = { ...context.state.settings[payload.key] }
        Object.assign(value, payload.value)
      }

      // Save settings
      context.commit('saveSettings', { key: payload.key, value: value })

      // Update persisted data file
      await saveData(context.state.settings, 'settings')

      // Update DOM
      if (payload.key === 'configs') context.commit('setDom')

      return
    },
  },
})
