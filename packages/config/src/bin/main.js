#!/usr/bin/env node
const {
  exit,
  env: { NETLIFY_BUILD_TEST },
} = require('process')

require('../utils/polyfills')

const resolveConfig = require('../main')
const { isUserError } = require('../error')

const { parseFlags } = require('./flags')

// CLI entry point
const runCli = async function() {
  const flags = parseFlags()

  try {
    const result = await resolveConfig(flags)
    handleCliSuccess(result)
  } catch (error) {
    handleCliError(error)
  }
}

// The result is printed as JSON on stdout on success (exit code 0)
const handleCliSuccess = function(result) {
  const resultA = serializeApi(result)
  const resultJson = JSON.stringify(resultA, null, 2)
  console.log(resultJson)
  exit(0)
}

// `api` is not JSON-serializable, so we remove it
// We still indicate it as a boolean in tests
const serializeApi = function({ api, ...result }) {
  if (NETLIFY_BUILD_TEST !== '1' || api === undefined) {
    return result
  }

  return { ...result, hasApi: true }
}

const handleCliError = function(error) {
  // Errors caused by users do not show stack traces and have exit code 1
  if (isUserError(error)) {
    console.error(error.message)
    return exit(1)
  }

  // Internal errors / bugs have exit code 2
  console.error(error.stack)
  exit(2)
}

runCli()
