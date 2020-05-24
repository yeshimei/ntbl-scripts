'use strict'

const fs = require('mz/fs')
const readline = require('readline')
const path = require('path')
const uuid = require('uuid')
const format = require('./format')

module.exports = (dir = process.cwd()) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = q => new Promise(r => rl.question(q, r))
  const manifest = {}
  const ask = ({key, label = key, default: def}) => {
    if (manifest[key]) def = manifest[key]
    if (typeof def === 'function') def = def()
    return question(`${label}: ${def ? `(${def}) ` : ''}`)
    .then(r => (r || def != null) && (manifest[key] = r || def))
  }

  const file = path.join(dir, 'book.json')
  const title = path.basename(dir)

  console.log('This utility will walk you through creating a book.json manifest file.')
  console.log('It only covers the most common items, and tries to guess sensible defaults.')
  console.log()
  console.log('Press ^C at any time to quit.')

  return fs.readFile(file, {encoding: 'utf8'})
  .then(data => Object.assign(manifest, JSON.parse(data)))
  .catch(() => {})
  .then(() => ask({key: 'title', default: title}))
  .then(() => ask({key: 'subtitle'}))
  .then(() => ask({label: 'author(s)', key: 'author'}))
  .then(() => {
    if (manifest.author) {
      const items = manifest.author.split(/\s*,\s*/)
      if (items.length > 1) {
        delete manifest.author
        manifest.authors = items
      }
    }
    return ask({key: 'date', default: format.date(new Date)})
  })
  .then(() => ask({key: 'publisher'}))
  .then(() => ask({
    label: 'rights statement',
    key: 'rights',
    default() {
      const y = new Date(manifest.date).getFullYear()
      return 'Copyright ©'+(y === y ? y : new Date().getFullYear())+
        (manifest.author ? ' '+manifest.author :
          manifest.authors ? ' '+ebrew.formatList(manifest.authors) : '')
    },
  }))
  .then(() => ask({
    label: 'section(s)',
    key: 'contents',
    default: 'book.md',
  }))
  .then(() => {
    const items = manifest.contents.split(/\s*,\s*/)
    if (items.length > 1) manifest.contents = items
    manifest.uuid = uuid.v4()

    const data = JSON.stringify(manifest, null, 2)

    console.log('About to write to '+file+':')
    console.log()
    console.log(data)
    console.log()

    return question('Is this ok? (yes) ')
    .then(res => {
      res = res.toLowerCase()
      if (res && res !== 'y' && res !== 'yes' && res !== 'ok') return
      rl.close()
      return fs.writeFile(file, data+'\n', {encoding: 'utf8'})
    })
  })
}
