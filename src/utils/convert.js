import { locale } from '@/utils/locale'

// Internal Functions
//----------------------------------------------------------------

const rangeName = (frequency) => {
  let range = locale('scales.ranges.sub')

  if (frequency > 60) range = locale('scales.ranges.lows')
  if (frequency > 250) range = locale('scales.ranges.lowmids')
  if (frequency > 600) range = locale('scales.ranges.mids')
  if (frequency > 2000) range = locale('scales.ranges.highmids')
  if (frequency > 5000) range = locale('scales.ranges.presence')
  if (frequency > 8000) range = locale('scales.ranges.air')

  return range
}

// Export Functions
//----------------------------------------------------------------

/**
 *
 * @param {String} string - Converts ♭ symbol to 'b' string
 * @returns
 */
export const flatToString = (string) => {
  return string.replace('♭', 'b')
}

/**
 *
 * @param {String} string - Converts 'b' string to ♭ symbol
 * @returns
 */
export const stringToFlat = (string) => {
  return string.replace('b', '♭')
}

/**
 *
 * @param {String} phrase - Capitalize a string
 * @returns
 */
export const capitalizeAll = (phrase) => {
  return phrase.replace(/(^\w{1})|(\s{1}\w{1})/g, (match) =>
    match.toUpperCase()
  )
}

/**
 *
 * @param {Number} frequency - Used to get back name range from integer
 * @returns
 */
export const range = (frequency) => {
  return {
    name: rangeName(frequency),
  }
}

/**
 *
 * @param {Number} frequency - Used to get back name range from integer
 * @param {Boolean} kilos - Calculate kilohertz or regular hertz
 * @returns
 */
export const calcFreq = (frequency, kilos = false) => {
  const hertz = locale('general.frequencies.hertz')
  const kilohertz = locale('general.frequencies.kilohertz')

  if (kilos) return `${parseFloat(frequency / 1000).toFixed(2)} ${kilohertz}`
  return `${parseFloat(frequency).toFixed(1)} ${hertz}`
}

/**
 *
 * @param {Number} number - Number determining decimal output
 * @param {Number} decimals - Number determining decimal output
 * @param {Boolean} string - Determine if output is string
 */
export const trimDecimals = (number, decimals, string = true) => {
  const result = Number(number.toFixed(decimals))
  if (string) return result.toString()
  return result
}

/**
 * @param {Number} number - Number determining decimal output
 */

export const timeString = (number, decimals = false) => {
  const end = decimals ? 21 : 19
  let output = [14, end]
  return new Date(number * 1000).toISOString().substring(output[0], output[1])
}
