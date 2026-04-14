import { track } from './lib/track.js'

const routes = {}
let currentCleanup = null
let appRoot = null

export function registerRoute(hash, renderFn) {
  routes[hash] = renderFn
}

export function navigate(hash) {
  window.location.hash = hash
}

export function initRouter(rootEl) {
  appRoot = rootEl

  async function onHashChange() {
    const hash = window.location.hash || '#/gallery'
    const renderFn = routes[hash] || routes['#/gallery']

    // Cleanup previous view
    if (typeof currentCleanup === 'function') {
      currentCleanup()
    }
    currentCleanup = null

    track('page_viewed', { route: hash })

    // Clear root and render new view. renderFn may be async (lazy-loaded route).
    appRoot.innerHTML = ''
    const cleanup = await renderFn(appRoot)
    if (typeof cleanup === 'function') {
      currentCleanup = cleanup
    }
  }

  window.addEventListener('hashchange', onHashChange)
  onHashChange()
}

export function getCurrentHash() {
  return window.location.hash || '#/gallery'
}
