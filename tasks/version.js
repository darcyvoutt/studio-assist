// Packages
import { simpleGit } from 'simple-git'
import { param } from '../tasks/cli.js'
import cwd from 'cwd'
import fs from 'fs'

// Internal
import {
  updateCargo,
  updatePackage,
  updateTauri,
} from '../tasks/files/update.js'

const change = param('--change')

// Get Current Version
const pkgFile = await fs.readFileSync(cwd('package.json'), 'utf8')
const version = JSON.parse(pkgFile).version
const versionArray = version.split('.')

// Increment based on change
switch (change) {
  case 'major':
    versionArray[0] = parseInt(versionArray[0]) + 1
    versionArray[1] = 0
    versionArray[2] = 0
    break

  case 'minor':
    versionArray[1] = parseInt(versionArray[1]) + 1
    versionArray[2] = 0
    break

  case 'patch':
    versionArray[2] = parseInt(versionArray[2]) + 1
    break
}

// Convert to string
const updatedVersion = versionArray.toString().replaceAll(',', '.')

// Tauri Configuration
await updateCargo(updatedVersion)
await updatePackage(updatedVersion)
await updateTauri(updatedVersion)

// Git commit
setTimeout(async () => {
  const git = simpleGit()
  const commit = `Update version to ${updatedVersion}`

  await git.add('.')
  await git.commit(commit)
  await git.addTag(`v${updatedVersion}`)

  console.log(commit)
}, 2000)
