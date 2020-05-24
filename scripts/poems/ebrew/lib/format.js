'use strict'
const slug = require('slug')
const pad0 = n => n < 10 ? '0'+n : n

exports.list = items => {
  switch (items.length) {
    case 0: return ''
    case 1: return items[0]
    case 2: return items[0]+' and '+items[1]
    default: return items.slice(0, -1).join(', ')+', and '+items[items.length - 1]
  }
}

exports.date = date =>
  date.getUTCFullYear()+'-'+pad0(date.getUTCMonth() + 1)+'-'+pad0(date.getUTCDate())

exports.sortTitle = s =>
  s.startsWith('The ') ? s.slice(4) + ', The' :
  s.startsWith('A ') ? s.slice(2) + ', A' : s

exports.outputName = m => slug(m.title)+'.epub'
