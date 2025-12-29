/**
 *
 * @param {string} message - Error message to log
 * @param {string} type - error|warn| null default = info
 */
export const log = async ({ message, type = '' }) => {
  const inDev = import.meta.env.DEV

  switch (type) {
    case 'error':
      if (inDev) console.error(message.trim())
      break

    case 'warn':
    case 'warning':
      if (inDev) console.warn(message.trim())
      break

    case 'info':
      if (inDev) console.log(message.trim())
      break

    default:
      if (inDev) console.log(message.trim())
      break
  }
}

