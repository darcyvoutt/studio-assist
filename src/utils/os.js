// Tauri APIs
import { type, version } from '@tauri-apps/api/os'

export const getOS = async () => {
  const osVersion = await version()
  const osType = await type()

  const os = {
    name: null,
    macos: false,
    windows: false,
    version: osVersion,
  }

  switch (osType) {
    case 'Darwin':
      os.name = 'MacOS'
      os.macos = true
      break

    case 'Windows_NT':
      os.name = 'Windows'
      os.windows = true
      break
  }

  return os
}
