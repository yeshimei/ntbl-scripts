'use strict'
const archiver = require('archiver')
const h = require('./h')
const format = require('./format')
const mime = require('mime')
const path = require('path')

const NS_XHTML = 'http://www.w3.org/1999/xhtml'
const NS_EPUB = 'http://www.idpf.org/2007/ops'
const NS_NCX = 'http://www.daisy.org/z3986/2005/ncx/'

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
const XHTML_DOCTYPE = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
const NCX_DOCTYPE = '<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">'

const xml = (...a) => XML_DECLARATION + h(...a)
const xhtml = (...a) => XML_DECLARATION + XHTML_DOCTYPE + h('html', {xmlns: NS_XHTML}, ...a)
const ncx = (...a) => XML_DECLARATION + NCX_DOCTYPE + h('ncx', {xmlns: NS_NCX, version: '2005-1'}, ...a)

module.exports = ({book, root, indent}) => {
  const archive = archiver.create('zip')
  const includeCover = book.coverURL && book.coverPage !== false
  const includeTOC = book.toc !== false

  archive.append('application/epub+zip', {name: 'mimetype', store: true})

  archive.append(
    xml('container', {version: '1.0', xmlns: 'urn:oasis:names:tc:opendocument:xmlns:container'},
      h('rootfiles',
        h('rootfile', {'full-path': 'OEBPS/content.opf', 'media-type': 'application/oebps-package+xml'}))),
    {name: 'META-INF/container.xml'})

  archive.append(
    xml('package', {xmlns: 'http://www.idpf.org/2007/opf', 'unique-identifier': 'uuid', version: '2.0'},
      h('metadata', {'xmlns:dc': 'http://purl.org/dc/elements/1.1/', 'xmlns:opf': 'http://www.idpf.org/2007/opf'},
        book.coverURL ? h('meta', {name: 'cover', content: 'cover-image'}) : [],
        h('dc:title', book.sortTitle && book.sortTitle !== book.title ? {'opf:file-as': book.sortTitle} : {}, book.fullTitle),
        h('dc:language', book.language),
        h('dc:rights', book.rights),
        h('dc:date', {'opf:event': 'creation'}, format.date(book.created)),
        h('dc:date', {'opf:event': 'copyright'}, format.date(book.copyrighted)),
        h('dc:date', {'opf:event': 'publication'}, format.date(book.date)),
        h('dc:publisher', book.publisher),
        h('dc:type', 'Text'),
        h('dc:identifier', {id: 'uuid', 'opf:scheme': 'uuid'}, book.uuid),
        book.isbn ? h('dc:identifier', {'opf:scheme': 'isbn'}, book.isbn) : [],
        book.doi ? h('dc:identifier', {'opf:scheme': 'doi'}, book.doi) : [],
        book.authors.map(author =>
          h('dc:creator', {'opf:role': 'aut'}, author))),
      h('manifest',
        book.coverURL ? h('item', {id: 'cover-image', properties: 'cover-image', 'media-type': mime.lookup(book.coverURL), href: book.coverURL}) : [],
        h('item', {id: 'toc', 'media-type': 'application/x-dtbncx+xml', href: 'toc.ncx'}),
        includeCover ? h('item', {id: 'cover', 'media-type': 'application/xhtml+xml', href: 'text/_cover.xhtml'}) : [],
        h('item', {id: 'nav', properties: 'nav', 'media-type': 'application/xhtml+xml', href: 'text/_nav.xhtml'}),
        h('item', {id: 'text-title', 'media-type': 'application/xhtml+xml', href: 'text/_title.xhtml'}),
        h('item', {id: 'style', 'media-type': 'text/css', href: 'style.css'}),
        book.texts.map((text, i) =>
          h('item', {id: `text-${i}`, 'media-type': 'application/xhtml+xml', href: `text/${i}.xhtml`})),
        book.resources.map((res, i) =>
          h('item', {id: `res-${i}`, 'media-type': mime.lookup(res.href), href: res.href}))),
      h('spine', {toc: 'toc'},
        includeCover ? h('itemref', {idref: 'cover'}) : [],
        h('itemref', {idref: 'text-title'}),
        includeTOC ? h('itemref', {idref: 'nav'}) : [],
        book.texts.map((text, i) =>
          h('itemref', {idref: `text-${i}`}))),
      h('guide',
        includeCover ? h('reference', {type: 'cover', title: 'Cover', href: 'text/_cover.xhtml'}) : [],
        h('reference', {type: 'title-page', title: 'Title Page', href: 'text/_title.xhtml'}),
        includeTOC ? h('reference', {type: 'toc', title: 'Table of Contents', href: 'text/_nav.xhtml'}) : [],
        h('reference', {type: 'text', title: 'Start of Content', href: 'text/0.xhtml'}))),
    {name: 'OEBPS/content.opf'})

  let navPointId = 0
  archive.append(
    ncx(
      h('head',
        h('meta', {name: 'dtb:uid', content: book.uuid}),
        h('meta', {name: 'dtb:depth', content: 6}),
        h('meta', {name: 'dtb:totalPageCount', content: 0}),
        h('meta', {name: 'dtb:maxPageNumber', content: 0})),
      h('docTitle', h('text', book.title)),
      h('navMap',
        h('navPoint', {id: `item-${navPointId++}`},
          h('navLabel', h('text', book.title)),
          h('content', {src: 'text/_title.xhtml'})),
        book.headings.map(function np(d) {
          return d.level > book.tocDepth ? [] : d.empty ? d.subheadings.map(np) : h('navPoint', {id: `item-${navPointId++}`},
            h('navLabel', h('text', d.title)),
            h('content', {src: `text/${d.chapter}.xhtml#${d.id}`}),
            d.subheadings.map(np))
        }))),
    {name: 'OEBPS/toc.ncx'})

  if (includeCover) archive.append(
    xhtml({'xmlns:epub': NS_EPUB},
      h('head',
        h('title', 'Title Page'),
        h('link', {rel: 'stylesheet', href: '../style.css'})),
      h('body', {class: 'coverpage', 'epub:type': 'cover'},
        h('img', {src: '../' + book.coverURL}))),
    {name: 'OEBPS/text/_cover.xhtml'})

  archive.append(
    xhtml({'xmlns:epub': NS_EPUB},
      h('head',
        h('title', 'Title Page'),
        h('link', {rel: 'stylesheet', href: '../style.css'})),
      h('body', {'epub:type': 'frontmatter'},
        h('section', {class: 'titlepage', 'epub:type': 'titlepage'},
          h('h1',
            h('span', {'epub:type': 'title'}, book.title),
            book.subtitle ? ':' : ''),
          book.subtitle ? [h('h2', {'epub:type': 'subtitle'}, book.subtitle)] : [],
          book.authors.length ? [h('p', {class: 'author'}, format.list(book.authors))] : []))),
    {name: 'OEBPS/text/_title.xhtml'})

  archive.append(
    xhtml({'xmlns:epub': NS_EPUB},
      h('head',
        h('title', 'Table of Contents'),
        h('link', {rel: 'stylesheet', href: '../style.css'})),
      h('body', {'epub:type': 'frontmatter'},
        h('nav', {'epub:type': 'toc', class: 'toc'},
          h('h1', 'Table of Contents'),
          h('ol',
            h('li', h('a', {href: '_title.xhtml'}, book.title)),
            book.headings.map(function ol(d) {
              return d.level > book.tocDepth ? [] :
                h('li', d.empty ? [] : h('a', {href: `${d.chapter}.xhtml#${d.id}`}, d.title), d.subheadings.length ? h('ol', d.subheadings.map(ol)) : [])
            }))),
        h('nav', {'epub:type': 'landmarks', hidden: ''},
          h('h1', 'Guide'),
          h('ol',
            includeCover ? h('li', h('a', {'epub:type': 'cover', href: '_cover.xhtml'}, 'Cover')) : [],
            h('li', h('a', {'epub:type': 'titlepage', href: '_title.xhtml'}, 'Title Page')),
            includeTOC ? h('li', h('a', {'epub:type': 'toc', href: '_nav.xhtml'}, 'Table of Contents')) : [],
            h('li', h('a', {'epub:type': 'bodymatter', href: '0.xhtml'}, 'Start of Content')))))),
    {name: 'OEBPS/text/_nav.xhtml'})

  book.xhtmls.forEach(function(content, i) {
    archive.append(
      xhtml({'xmlns:epub': NS_EPUB},
        h('head',
          h('title', `Chapter ${i+1}`),
          h('link', {rel: 'stylesheet', href: '../style.css'}),
          book.cssURLs.map(href => h('link', {rel: 'stylesheet', href}))),
        h('body', {'epub:type': 'bodymatter'}, h.raw(content))),
      {name: `OEBPS/text/${i}.xhtml`})
  })

  book.resources.forEach(function(res) {
    archive.file(res.file, {name: `OEBPS/${res.href}`})
  })

  archive.file(path.resolve(__dirname, '../res/default.css'), {name: 'OEBPS/style.css'})

  archive.finalize()
  return Promise.resolve(archive)
}
