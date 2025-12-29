import en from '@/locale/en.json'
import es from '@/locale/es.json'
import fr from '@/locale/fr.json'

// Internal functions
// =========================================================================

const file = () => {
  const locales = { en, es, fr }
  return locales[language()]
}

// Export functions
// =========================================================================

export const language = () => {
  const language = localStorage.getItem('language')
  return language !== null ? language : navigator.language.split('-')[0]
}

export const locale = (string, args = null) => {
  // Get local object
  let text = file()

  // Get property
  string.split('.').forEach((key) => {
    if (text[key] === undefined) text = ''
    else text = text[key]
  })

  // Replace strings
  if (args !== null) {
    Object.keys(args).forEach((key) => {
      const findString = `[${key}]`
      const replaceWith = args[key]
      if (!text.includes(findString)) return
      text = text.replace(findString, replaceWith)
    })
  }

  // Output
  return text
}
