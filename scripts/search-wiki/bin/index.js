#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const cheerio = require('cheerio')
const program = require('commander')
const request = require('request-promise')
const { version } = require('../package')
const log = require('@ntbl/log')()
let count = 0


const formatList = {
  default (content) {
    return  content.match(/\S+.*\S|\S+/g) || []
  },
  '掌阅' (content) {
    return content.match(/原文：(.+)/gm).map(text => text.split('：')[1])
  },
}

program
  .version(version)
  .usage('[OPTIONS] INPUT [OUTPUT]')
  .option('-f, --format <name>', '输入文本的处理格式')
  .option('-t, --text <content>', '在命令行输入词语并打印，多个单词以冒号分隔')
  .option('-a, --all', '将未精准查询到的词语进行模糊匹配')
  .parse(process.argv)


const [f1, f2] = program.args
let content = program.text
  ? program.text.split(':')
  : formatList[program.format || 'default'](fs.readFileSync(f1, 'utf8'))

  print(count, content.length, '拼命查询中...')

  content = content.map(async function find(word) {
      let text, url

      try {
        url = 'https://baike.baidu.com/item/' + encodeURI(word)
        const html = await request(url)

        text = cheerio.load(html)('.lemma-summary').children().first().text()

        if (program.all && !text) {
          // 将未精准查询到的词语进行模糊匹配
          const html2 = await request('https://baike.baidu.com/search/none?word=' + encodeURI(word))
          // 获取搜索列表第一个词条链接
          url = cheerio.load(html2)('a.result-title').first().attr('href')

          if (url) {
            // 重新查询，并获取简介
            text = cheerio.load(await request(url))('.lemma-summary').children().first().text()
          }
        }

      } catch (e) {
        // 连接异常时，将重新链接
        if (e && e.message  === 'Error: read ECONNRESET') {
          return await find(word)
        }

        return `- **${word}** \r`
      }

        text = text.replace(/\n+|\[[0-9]\]| */gm, '')


        if (text) {
          // 打印进度
          print(++count, content.length, word)
          return {
            success: true,
            data: `- [**${word}**](${url}) - ${text} \r`
          }
        }
        return {
          success: false,
          data: `- **${word}** \r`
        }
  })



Promise.all(content)
  .then(result => {
    log.stop()
    let text = result.map(e => e.data)
    let successText = result.filter(t => t.success)
    const msg =  `感谢您使用 searchWiki！ \n待查词语总数：${chalk.underline.bold.yellow(result.length)} \n已查词语总数：${chalk.underline.bold.green(successText.length)} ${!program.all && successText.length !== text.length ? chalk.red('\ntip ☞  附加选项 -a 会将未精准查询到的词语再进行一次模糊匹配') : ''}`

    if (program.text) {
      console.log(text.join(''))
    } else {
      fs.writeFileSync(f2 || path.parse(f1).name + '.md', text.join(''))
      console.log(msg + '\n')
    }
    process.exit(0)
  })



function print(i, total, text) {
  log.start(data => `[${i}/${total}] ${data.frame} ${text}`)
}

