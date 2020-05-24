'use strict'
const fs = require('mz/fs')
const path = require('path')
const _mkdirp = require('mkdirp')
const mkdirp = (dir, opts) => new Promise((r, j) => _mkdirp(dir, opts, e => e ? j(e) : r()))
const uuid = require('uuid')
const getStdin = require('get-stdin')

const format = require('./format')
const normalizeManifest = require('./normalize')
const ensureUUID = require('./ensure')
const loadBook = require('./load')
const createArchive = require('./create')

module.exports = (input, output) => {
  const stdin = input === '-'
  const root = stdin ? process.cwd() : path.dirname(input)
  return (stdin ? getStdin() : fs.readFile(input, {encoding: 'utf8'}))
  .then(JSON.parse)
  .then(m => stdin ? m : ensureUUID(m, input))
  .then(normalizeManifest)
  .then(manifest =>
    loadBook(manifest, root).then(book => {
      const stdout = output === '-'
      output = output || format.outputName(manifest)
      return Promise.all([
        stdout || mkdirp(path.dirname(output)),
        createArchive({book, root, indent: 2})
      ]).then(([_, archive]) => new Promise((resolve, reject) => {
        archive.pipe(stdout ? process.stdout : fs.createWriteStream(output))
        archive.on('end', () => resolve(output))
        archive.on('error', reject)
      }))
    }))
}
