import { createRequire } from 'node:module'

for (const key of Object.keys(process.env)) {
  if (/^(APPLE_|TAURI_PRIVATE_KEY$|TAURI_KEY_PASSWORD$)/.test(key)) {
    delete process.env[key]
  }
}

const require = createRequire(import.meta.url)
const cli = require('@tauri-apps/cli')

cli.run(['build', ...process.argv.slice(2)], 'yarn build').catch((error) => {
  cli.logError(error.message)
  process.exitCode = 1
})
