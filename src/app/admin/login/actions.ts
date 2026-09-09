'use server'

export async function checkIsAdmin(email: string) {
  const allowedAdmins = (process.env.ADMIN_EMAILS || 'babayodetestimony0318@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
  return allowedAdmins.includes(email.toLowerCase())
}
