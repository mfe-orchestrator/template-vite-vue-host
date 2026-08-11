// configure() must run at the very top of the entry point, synchronously, before
// anything imports a remote. It is idempotent.
import { configure } from '@mfe-orchestrator-hub/client'

configure({
  backendUrl: import.meta.env.VITE_MFE_BACKEND_URL,
  projectId: import.meta.env.VITE_MFE_PROJECT_ID,
  environment: import.meta.env.VITE_MFE_ENVIRONMENT
})

import { createApp } from 'vue'
import App from './App.vue'
import './index.css'

createApp(App).mount('#app')
