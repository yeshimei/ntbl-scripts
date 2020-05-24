'use strict'
const format = require('./format')

function strarray(data, message, optional) {
  if (optional && !data) return []
  if (typeof data === 'string') data = [data]
  if (!Array.isArray(data)) throw new Error(message)
  return data
}

module.exports = m => {
  m.title = m.title || 'Untitled'
  m.sortTitle = m.sortTitle || format.sortTitle(m.title)
  m.subtitle = m.subtitle || ''
  m.fullTitle = m.title + (m.subtitle ? ': ' + m.subtitle : '')
  m.language = m.language || 'en'
  m.contents = strarray(m.contents, 'm key "contents" must be a filename or an array of filenames.')
  m.css = strarray(m.css, 'm key "css" must be a string or array of strings', true)
  m.authors = strarray(m.authors || m.author, 'm key "author" or "authors" must be a string or an array of strings', true) || null
  m.publisher = m.publisher || ''
  m.tocDepth = m.tocDepth || 6

  m.date = m.date ? new Date(m.date) : new Date
  m.created = m.created ? new Date(m.created) : m.date
  m.copyrighted = m.copyrighted ? new Date(m.copyrighted) : m.date
  m.rights = m.rights || (m.authors ? `Copyright ©${m.copyrighted.getFullYear()} ${format.list(m.authors)}` : null)

  delete m.author
  return m
}
