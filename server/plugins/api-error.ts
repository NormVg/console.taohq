export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    // Only intercept API route errors
    if (event && event.path && event.path.startsWith('/api/')) {
      // Don't modify if response is already handled
      if (event.node.res.headersSent || event.node.res.writableEnded) {
        return
      }

      // Use the custom message or the standard HTTP status message
      const statusCode = error.statusCode || 500
      let message = error.statusMessage || error.message || 'Internal Server Error'

      // Clean up common Nuxt verbose messages if necessary, or just use it directly.
      // The user specifically wanted a clean normal JSON response.
      
      event.node.res.statusCode = statusCode
      event.node.res.setHeader('Content-Type', 'application/json')
      event.node.res.end(JSON.stringify({
        error: message
      }))
    }
  })
})
