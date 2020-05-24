'use strict'
const fs = require('mz/fs')
const path = require('path')
const cheerio = require('cheerio')
const slug = require('slug')

const marked = require('marked')
marked.setOptions({
  gfm: true,
  sanitize: false,
  smartypants: true,
})

module.exports = (manifest, root) => {
  return Promise.all(manifest.contents.map(content => fs.readFile(path.resolve(root, content), {encoding: 'utf8'})))
  .then(texts => {
    const headings = []
    const stack = [headings]

    texts = texts.map((text, i) =>
      text.replace(/^(#{1,6}).+/gm, function(line, hashes) {
        const n = hashes.length
        const title = line.slice(n).trim()
        while (n > stack.length) {
          const anon = {
            empty: true,
            level: stack.length,
            subheadings: [],
          }
          stack[stack.length - 1].push(anon)
          stack.push(anon.subheadings)
        }
        while (n < stack.length) stack.pop()
        const head = {
          title,
          subheadings: [],
          chapter: i,
          level: n,
          id: slug(title),
        }
        stack[stack.length - 1].push(head)
        stack.push(head.subheadings)

        return `<h${n} id="${head.id}">${title}</h${n}>`
      }))

    const resources = []
    function addResource(src, relative = []) {
      const file = path.resolve(root, ...relative, src)
      const ext = path.extname(file)
      const href = `resources/${resources.length}${ext}`
      resources.push({file, href})
      return href
    }
    const cssURLs = manifest.css.map(s => '../' + addResource(s))
    const xhtmls = texts.map(function(text, i) {
      const $ = cheerio.load(marked(text))
      $('img').each(function() {
        if (!/^\w+:/.test(this.attribs.src)) {
          this.attribs.src = '../' + addResource(this.attribs.src, [manifest.contents[i], '..'])
        }
      })
      return $.xml()
    })
    if (manifest.cover) manifest.coverURL = addResource(manifest.cover)

    return Object.assign({}, manifest, {texts, xhtmls, resources, headings, cssURLs})
  })
}
