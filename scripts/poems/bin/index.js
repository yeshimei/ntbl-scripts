#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const cheerio = require('cheerio')
const program = require('commander')
const request = require('request-promise')
let cp = require('child_process')
const { version } = require('../package')
const log = require('@ntbl/log')()
const util = require('util')
const rmdir = util.promisify(require('rmdir'))
const exec = util.promisify(require('child_process').exec)

const data = new Date
const putoutDir = 'book'
let index = 1
const config = {
  "title": "诗集",
  "subtitle": "由 poems 脚本生成",
  "author": "Sunny",
  "date": `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`,
  "rights": "Public Domain",
  "contents": [
  ],
}

const headers = {
  cookie: "login=flase; ASP.NET_SessionId=mg52uwbr3sc01ms0gxjhqbi5; gsw2017user=962125%7c77E017332D4D0D0C189704D93502A93B; login=flase; gswZhanghao=15290996575; gswPhone=15290996575; wxopenid=defoaltid; Hm_lvt_04660099568f561a75456483228a9516=1590250311,1590251749,1590252913,1590280519; Hm_lpvt_04660099568f561a75456483228a9516=1590280694",
  "upgrade-insecure-requests": 1,
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
        }

log.register('output', {
  checking: data => `[${data.args[0]}/${data.args[1]}] ${data.frame} 正在努力查询中...`,
  checked: data => `共${data.args[0]}首，成功查询到 ${data.args[1] - 1} 首 \n 已经为您生成自定义诗集，感谢您的使用。`
})




program
  .version(version)
  .usage('[OPTIONS] INPUT [PUTOUT]')
  .parse(process.argv)


const [f1, f2] = program.args



let content = fs.readFileSync(f1, 'utf8')
let words = content.match(/\S+.*\S|\S+/g).map(line => {
  const [title, author] = line.split(/\s+/)
  return { title, author }
})


async function find (word) {
  let rawTitle = word.title
  let rawAuthor = word.author
  let text = ''

  // 作者可选
  rawAuthor = rawAuthor ? '+' + rawAuthor : ''
  url = 'https://so.gushiwen.org/search.aspx?value=' + encodeURI(rawTitle) + encodeURI(rawAuthor)

  try {
    const html = await request(url)
    const url2 = 'https://so.gushiwen.org/' + cheerio.load(html)('.sons').first().find('.yizhu').next().find('a').attr('href')
    const html2 = await request(url2)
    
    const $ = cheerio.load(html2)

    const spreadATag = $('.contyishang')
    const element = $('.sons').first()

    // 诗
    const poemTitle =  element.find('h1').text()
    const poemAuthor = element.find('.source a').last().text()
    const poemContent = element.find('.contson').html().replace('<br>', '\n\n')
    text += `# 《${poemTitle}》 ${poemAuthor} \n  ${poemContent} \n\n`

    // 翻译。注释。鉴赏
    for(let i = 0; i < spreadATag.length; i++) {
      const ele2 = cheerio(spreadATag[i])
      // 目前，仅从更多阅读里爬取数据
      const href = ele2.find('a[style*="none"]').attr('href')
      const title = ele2.find('h2 span').text()

      if (!href) {
        const eleContent = ele2.text().replace(title, '')
        text += `<h2>${title}</h2> \n\n ${eleContent} \n\n`
        continue
      };

      
      const id = href.match(/[A-Z0-9]{10,}/g)[0]
      // console.log(title, id);
      let url = title === '译文及注释' 
        ? 'https://so.gushiwen.org/nocdn/ajaxfanyi.aspx?id=' 
        : 'https://so.gushiwen.org/nocdn/ajaxshangxi.aspx?id='
      
      let html3 = await request(url +  id, {headers})
      // console.log(html3);
      
      if (html3 === '未登录') continue;
      
      const ele = cheerio.load(html3)('.contyishang')
      let eleContent = ''

      if (title === '译文及注释') {
        ele.find('p').each(function () {
          eleContent += cheerio(this).html().replace(/<strong>(.*)<\/strong>/g, '**$1** \n\n').replace(/<br>/g, '\n\n').replace(/<a title.*a>/g, '') + '\n\n'
        })

      } else {
        eleContent = ele.text().replace(title, '')
      }
      
      text += `<h2>${title}</h2> \n\n ${eleContent} \n\n`
    }

  } catch (e) {
    // console.log(e);
  }

  // 清除行前的空格和无用乱码字符
  text = text.replace(/(　　||&#x3000;&#x3000;)/gm, '\n\n')

  const filename = `${putoutDir}/${uuid()}.md`
  // 生成单独的 md 文件
  fs.writeFileSync(filename, text)
  // 记录文件名（按顺序）
  word.filename = filename
  // 进度
  log.output.checking(words.length, index++)
}



async function init () {

  if (fs.existsSync('book')) {
    await rmdir('book')
  }

  fs.mkdirSync('book')
  await Promise.all(words.map(word => find(word)))
  // 生成配置文件
  config.contents = words.map(word => word.filename)
  fs.writeFileSync('book.json', JSON.stringify(config))
  // // 生成 epub 
  // // 需要提前安装 ebrew
  // // https://github.com/jonnypetraglia/ebrew
  // // uuid 未定义错误，请修改 /bin/ensure.js 文件中 uuid.v4() 为任意数值

  // const title = f2 || path.parse(f1).name
  // const query = `poems-make ${title}.epub`
  // console.log(query);
  
  // const { stdout, stderr } = await exec(query);
  // console.log('stdout:', stdout);
  // console.error('stderr:', stderr);
  log.output.checked(words.length, index)
}

function uuid () {
  return Math.random().toString(32).substring(2)
}

init()
