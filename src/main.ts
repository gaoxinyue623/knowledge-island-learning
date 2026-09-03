import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { pinia } from './stores/pinia'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/base.css'
import './styles/utilities.css'
import './styles/transitions.css'
import './styles/components.css'
import './styles/dev-ui.css'
import './styles/curriculum.css'
import './styles/learning-map.css'
import './styles/lesson-player.css'
import './styles/question-engine.css'
import './styles/mastery.css'
import './styles/learning-strategy.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
