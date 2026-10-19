<script setup lang="ts">
import { defineAsyncComponent, h } from 'vue'
import ManifestPanel from './components/ManifestPanel.vue'

// Example remote, declared in vite.config.ts. Rename "exampleremote" and the slug
// it points to, or delete both once you wire your own frontends.
const RemoteButton = defineAsyncComponent({
  loader: () => import('exampleremote/Button'),
  loadingComponent: { render: () => h('span', 'Loading remote…') },
  errorComponent: {
    render: () =>
      h(
        'span',
        { class: 'remote-error' },
        'Remote "example-remote" is not available. Point vite.config.ts at one of your own slugs.'
      )
  }
})
</script>

<template>
  <div class="App">
    <h1>Vite &amp; Vue host</h1>
    <p>
      This host resolves its remotes through the MFE Orchestrator: it never knows,
      and never chooses, which version it is served.
    </p>

    <div class="card">
      <RemoteButton />
    </div>

    <ManifestPanel />
  </div>
</template>

<style>
.remote-error {
  color: #b4530a;
}
</style>
