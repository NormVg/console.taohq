import { defineEventHandler, readBody, setCookie, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body || !body.username || !body.password) {
    throw createError({ statusCode: 400, message: 'Username and password are required' })
  }

  if (body.username === config.public.adminUsername && body.password === config.public.adminPassword) {
    // Set cookie for 7 days
    setCookie(event, 'console_authenticated', 'true', {
      httpOnly: false, // Must be readable by client for middleware if needed, but actually the middleware runs on server too.
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return { success: true }
  } else {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }
})
