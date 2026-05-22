import './assets/css/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import { createHead } from '@unhead/vue/client'
import ui from '@nuxt/ui/vue-plugin'
import { i18n } from './i18n'

import App from './App.vue'
import { loadState } from './lib/storage'

const saved = loadState()
i18n.global.locale.value = saved.settings.locale
document.documentElement.lang = saved.settings.locale === 'zh' ? 'zh-CN' : 'en'

const app = createApp(App)
const head = createHead()
const router = createRouter({
  routes,
  history: createWebHistory()
})

app.use(head)
app.use(router)
app.use(i18n)
app.use(ui)
app.mount('#app')

if (import.meta.hot) {
  handleHotUpdate(router)
}
