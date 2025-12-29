/**
 *
 * @param {Float} bytes - the number of bytes to convert to string
 * @returns {String}
 */
export const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const fileSize = (bytes / Math.pow(1024, i)).toFixed(2)
  return `${fileSize} ${sizes[i]}`
}

/**
 * @param {String} str - String to convert to filename
 * @return {String}
 */
export const fileName = (str) =>
  str.split('/').pop().substring(0, str.lastIndexOf('.'))

/**
 * @param {String} str - String to convert to filename
 * @return {String}
 */
export const fileType = (str) => {
  let type = str.split('/').pop().replace('x-', '')
  if (type === 'mpeg') type = 'mp3'
  return type
}
