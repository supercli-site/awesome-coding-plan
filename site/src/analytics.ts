// Anonymous page counts go only to the shared Core; paths stay in this browser.
let previousPath = ''
export function trackPageView(path = location.pathname): void {
  if (typeof window === 'undefined') return
  try {
    if (location.hostname !== 'plan.supercli.site' || navigator.doNotTrack === '1' || path === previousPath) return
    if (localStorage.getItem('usage-analytics') === 'off' || localStorage.getItem('blog-analytics') === 'off') return
    previousPath = path
    void fetch('https://api.webkubor.online/v1/analytics/events', {
      method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
      signal: AbortSignal.timeout(5000), headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project: 'awesome-coding-plan', event_id: crypto.randomUUID(), event: 'page.view', properties: {} }),
    }).catch(() => {})
  } catch { /* Statistics must never interrupt browsing. */ }
}
