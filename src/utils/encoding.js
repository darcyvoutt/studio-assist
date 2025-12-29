export const encode = (obj) => {
  if (typeof obj !== 'object' || obj === null) return false
  return window.btoa(JSON.stringify(obj))
}

export const decode = (str) => {
  if (typeof str !== 'string' || str.length === 0) return false
  return JSON.parse(window.atob(str))
}
