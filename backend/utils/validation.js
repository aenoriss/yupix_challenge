export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long'
  }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  if (!hasUpperCase && !hasNumber) {
    return 'Password must contain at least one uppercase letter or number'
  }
  
  return null
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return 'Please provide a valid email address'
  }
  return null
}