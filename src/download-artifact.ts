import * as core from '@actions/core'
import * as artifact from '@actions/artifact'
import * as os from 'os'
import {resolve} from 'path'
import {Inputs, Outputs} from './constants'

async function run(): Promise<void> {
  try {
    const name = core.getInput(Inputs.Name, {required: false})
    const path = core.getInput(Inputs.Path, {required: false})
    const maxTries = parseInt(core.getInput(Inputs.MaxTries, {required: false}))
    const retryDelayMs = parseInt(core.getInput(Inputs.RetryDelayMs, {required: false}))

    let resolvedPath
    // resolve tilde expansions, path.replace only replaces the first occurrence of a pattern
    if (path.startsWith(`~`)) {
      resolvedPath = resolve(path.replace('~', os.homedir()))
    } else {
      resolvedPath = resolve(path)
    }
    core.debug(`Resolved path is ${resolvedPath}`)

    const artifactClient = artifact.create()
    if (!name) {
      // download all artifacts
      core.info('No artifact name specified, downloading all artifacts')
      core.info(
        'Creating an extra directory for each artifact that is being downloaded'
      )
      const downloadResponse = await artifactClient.downloadAllArtifacts(
        resolvedPath
      )
      core.info(`There were ${downloadResponse.length} artifacts downloaded`)
      for (const artifact of downloadResponse) {
        core.info(
          `Artifact ${artifact.artifactName} was downloaded to ${artifact.downloadPath}`
        )
      }
    } else {
      // download a single artifact
      const sleep = (ms) => new Promise(r => setTimeout(r, ms))
      
      core.info(`Starting download for ${name}`)
      const downloadOptions = {
        createArtifactFolder: false
      }

      let downloaded = false

      for (var i: number = 1; i <= maxTries; i++) {
        core.debug(`Artifact ${name} download attempt ${i}/${maxTries}`)
        try {
          const downloadResponse = await artifactClient.downloadArtifact(
            name,
            resolvedPath,
            downloadOptions
          )
          core.info(
            `Artifact ${downloadResponse.artifactName} was downloaded to ${downloadResponse.downloadPath}`
          )
          downloaded = true
          break
        } catch (err) {
          core.info(
            `Artifact ${name} download failed, will retry in ${retryDelayMs}ms: ${err.message}`
          )
        }
        await sleep(retryDelayMs)
      }

      if (!downloaded) {
        core.setFailed(`Artifact ${name} could not be downloaded after ${maxTries} attempts`)
        return
      }
    }

    // output the directory that the artifact(s) was/were downloaded to
    // if no path is provided, an empty string resolves to the current working directory
    core.setOutput(Outputs.DownloadPath, resolvedPath)
    core.info('Artifact download has finished successfully')
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
