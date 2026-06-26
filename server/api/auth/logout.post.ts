import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, 'console_authenticated', { path: '/' })
  return { success: true }
})
