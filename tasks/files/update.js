import cwd from 'cwd'
import fs from 'fs'

// Cargo Configuration
export const updateCargo = async (version) => {
  const path = cwd('src-tauri/Cargo.toml')
  const file = await fs.readFileSync(path, 'utf8')
  const update = file.replace(
    /^version\s*=\s*"[^"]+"$/gm,
    `version = "${version}"`
  )
  await fs.writeFileSync(path, update)
}

// Package Configuration
export const updatePackage = async (version) => {
  const path = cwd('package.json')
  const file = await fs.readFileSync(path, 'utf8')
  const data = JSON.parse(file)
  data.version = version
  await fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

// Tauri Configuration
export const updateTauri = async (version) => {
  const path = cwd('src-tauri/tauri.conf.json')
  const file = await fs.readFileSync(path, 'utf8')
  const data = JSON.parse(file)
  data.package.version = version
  await fs.writeFileSync(path, JSON.stringify(data, null, 2))
}
