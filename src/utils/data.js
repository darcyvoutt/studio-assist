import {
  BaseDirectory,
  createDir,
  exists,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/api/fs'
import { structSettings } from '@/struct'
import { encode, decode } from './encoding'

// Local Variables
const baseDir = BaseDirectory.AppData
const dataDir = 'data'
const configsFile = 'configs.txt'
const settingsFile = 'settings.json'
const filePathConfigs = `${dataDir}/${configsFile}`
const filePathSettings = `${dataDir}/${settingsFile}`

// Local Method
const filePath = (type) => {
  switch (type) {
    case 'configs':
      return filePathConfigs
    case 'settings':
      return filePathSettings
    default:
      return filePathSettings
  }
}

const fileName = (type) => {
  switch (type) {
    case 'configs':
      return configsFile
    case 'settings':
      return settingsFile
    default:
      return settingsFile
  }
}

const _createDataFile = async (type = 'settings') => {
  try {
    const contents =
      type === 'settings' ? JSON.stringify(structSettings) : encode({})
    await createDir(dataDir, { dir: baseDir, recursive: true })
    await writeTextFile({ contents, path: filePath(type) }, { dir: baseDir })
  } catch (e) {
    console.error(`Unable to create data file type: ${type}. Error: ${e}`)
    return false
  }
}

const _findDataFile = async (type = 'settings') => {
  try {
    const filePath = type === 'settings' ? filePathSettings : filePathConfigs
    return await exists(filePath, { dir: baseDir })
  } catch (e) {
    console.error(`Unable to find data file type: ${type}. Error: ${e}`);
    return false
  }
}

// Export Functions

/**
 *
 * @param {String} type - Options: 'configs', 'settings'
 * @returns {Object}
 */
export const initData = async (type = 'settings') => {
  const hasDataFolder = await _findDataFile(type)
  if (!hasDataFolder) await _createDataFile(type)
  return
}

/**
 *
 * @param {String} type - Options: 'configs', 'settings'
 * @returns {Object | null}
 */
export const getData = async (type = 'settings') => {
  // Check for file existence
  await initData(type)

  // Try getting data
  try {
    const data = await readTextFile(filePath(type), { dir: baseDir })
    return type === 'configs' ? decode(data) : JSON.parse(data)
  } catch (e) {
    console.error(`Unable to get data for file type: ${type}. Error: ${e}`);
    return null
  }
}

/**
 *
 * @param {String} type - Options: 'configs', 'settings'
 * @returns {Boolean | Error}
 */
export const resetData = async (type = 'settings') => {
  try {
    const settings = JSON.stringify(structSettings)
    const fallback = type === 'configs' ? '' : '{}'

    await writeTextFile(
      {
        contents: type === 'settings' ? settings : fallback,
        path: filePath(type),
      },
      { dir: baseDir }
    )
  } catch (e) {
    console.error(`Unable to reset data for file type: ${type}. Error: ${e}`)
    return false
  }
}

/**
 *
 * @param {Object} obj - Must pass object
 * @param {String} type - Options: 'configs', 'settings'
 * @returns {Boolean}
 */
export const saveData = async (obj, type = 'settings') => {
  if (typeof obj !== 'object' || obj === null) return
  try {
    await writeTextFile(
      {
        contents: type === 'configs' ? encode(obj) : JSON.stringify(obj),
        path: filePath(type),
      },
      { dir: baseDir }
    )
    return true
  } catch (e) {
    console.error(`Unable to save data for file type: ${type}. Error ${e}`)
    return false
  }
}
