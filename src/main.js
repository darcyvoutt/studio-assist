import '../dist/main.css'

import { createApp } from 'vue'
import { store } from './stores/index'
import { locale } from '@/utils/locale'

import App from './App.vue'

const app = createApp(App)

app.config.globalProperties.$filters = {
  locale(string, args) {
    return locale(string, args)
  },
}

app.use(store)
app.mount('#app')
