'use strict'
module.exports = h

const escapes = {'<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;'}
function esc(s) {return s.replace(/[<>"&]/g, x => escapes[x])}

class Stream {
  constructor(s) {this.s = s || ''}
  write(s) {this.s += s}
  toString() {return this.s}
}

class Node {
  toString() {
    const s = new Stream
    this.write(s)
    return s.toString()
  }
}
class Element extends Node {
  constructor(name) {
    super()
    this.name = name
    this.attrs = {}
    this.children = []
  }
  add(a) {
    if (Array.isArray(a)) {
      for (const c of a) this.add(c)
    } else if (a instanceof Node) {
      this.children.push(a)
    } else if (a && typeof a === 'object') {
      for (const k of Object.keys(a)) this.attrs[k] = ''+a[k]
    } else {
      this.children.push(new Text(a))
    }
    return this
  }
  write(s) {
    s.write(`<${this.name}`)
    for (const k of Object.keys(this.attrs)) {
      s.write(` ${k}="${esc(this.attrs[k])}"`)
    }
    if (this.children.length) {
      s.write('>')
      for (const c of this.children) c.write(s)
      s.write(`</${this.name}>`)
    } else {
      s.write('/>')
    }
  }
}
class Raw extends Node {
  constructor(data) {
    super()
    this.data = '' + data
  }
  write(s) {s.write(this.data)}
}
class Text extends Raw {
  write(s) {s.write(esc(this.data))}
}

function h(name, ...contents) {return new Element(name).add(contents)}
h.raw = function raw(s) {return new Raw(s)}
