const darkMode = window.matchMedia('(prefers-color-scheme: dark)')

// Internal functions
// ================================================================
const scheme = (theme) => {
  // If system is dark
  const systemDark = darkMode.matches

  // Determine what to display
  if (theme === 'auto' && systemDark)
    document.querySelector('html').setAttribute('class', 'dark')
  else if (theme === 'dark')
    document.querySelector('html').setAttribute('class', 'dark')
  else document.querySelector('html').removeAttribute('class', 'dark')
}

// Exported functions
// ================================================================

/**
 *
 * @param {String} language - en|es|fr
 * @param {Integer} fontsize - Number for base fontsize
 * @param {String} theme - light|dark
 */
export const updateDom = ({ fontsize, language, theme }) => {
  // Set language to display
  localStorage.setItem('language', language)
  document.querySelector('html').setAttribute('lang', language)

  // Base Font Size
  document
    .querySelector('html')
    .setAttribute('style', `font-size: ${fontsize}px`)

  // Set color scheme
  scheme(theme)

  // Add event listener to update scheme
  if (darkMode.addEventListener)
    darkMode.addEventListener('change', () => scheme(theme))

  // Some older versions of Safari use addListener instead of addEventListener
  if (darkMode.addListener) darkMode.addListener(() => scheme(theme))

  // Remove context menu
  if (import.meta.env.PROD)
    document.addEventListener('contextmenu', (e) => e.preventDefault())
}
