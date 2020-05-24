'use strict'
const fs = require('mz/fs')

module.exports = (manifest, input, indent = 2) =>
  manifest.uuid ? Promise.resolve(manifest) :
  fs.writeFile(input, JSON.stringify(Object.assign(manifest, {uuid: 1}), null, indent)).then(() => manifest)
