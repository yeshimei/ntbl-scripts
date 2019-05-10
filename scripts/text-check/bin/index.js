#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const program = require('commander')
const request = require('request-promise')
const { version } = require('../package')
const heapSort = require('../utils/HeapSort')
const log = require('@ntbl/log')()
let total = 0
let checkCount = 0
let checkData = []
let textLen = 10000
let wordList = {}

program
  .version(version)
  .usage('[OPTIONS] INPUT [OUTPUT]')
  .option('-n, --number <n>', '保留前 n 个词语。如果保存所有的词语请指定为 0，默认为 10 个 ', parseInt)
  .option('-l, --lengths <n>', '检查词语的长度，指定多个时以冒号分隔，默认为 2:3:4')
  .parse(process.argv)

console.time(`completed！`)

const [input, output] = program.args
let number =  program.number || (program.number === 0 ? undefined : 10)
let lengths = (program.lengths && program.lengths.split(':')) || [2, 3, 4]
let content = fs.readFileSync(input, 'utf8')

progress(`${content.length} words`)

content = content.replace(/[^\u4e00-\u9fa5a-zA-Z]+/g, '')

progress(`${content.length} valid words`)

async function wordGroup() {

  let pros = []
  for (let i = 0; i < content.length; i += textLen) {
    pros.push(f(content.substring(i, i + textLen)))
  }

  return await Promise.all(pros)

  function f(data) {
    return new Promise(resolve => {
      for (let i = 0; i < data.length; i++) {
        lengths.forEach(len => {
          len = Number(len)
          const word = data.slice(i, i + len)
          if (word in wordList) {
            wordList[word]++
          } else {
            wordList[word] = 1
            total++
          }
        })
      }
      log.log(total + ' grouping words...')
      resolve()
    })
  }
}



wordGroup()
  .then(() => {
    progress(`${total} group words`)
    log.log('converting...')
    wordList = Object.entries(wordList)

    progress('converted')
    log.log('sorting...')
    
    heapSort(wordList, 1)
    // wordList = wordList.sort((a, b) => b[1] - a[1])
    wordList.reverse()
    // console.log(wordList)
    progress('sorted')
    check(number)
      .then(async function f2 (d) {
        checkData = d.filter(Boolean)
        if (checkData.length >= number) {
          return checkData
        } else {
          // 检查完所有的组合词语后结束查询
          return slice.index >= wordList.length ? checkData : await f2(checkData.concat(await check(number)))
        }
      })
      .then(data => {
        log.stop()
        progress(`${number} high frequency words have been obtained`)
        let text = data.slice(0, number).map(o => `${o[1]} ☞ ${o[0]}`).join('\n')
        log.log('saving...')
        fs.writeFileSync(output || path.parse(input).name + '-check.txt', text)
        progress('saved')

        console.timeEnd(`completed！`)
      })
  })




function check(n) {
   const ps =  slice(n).map(async o => {
    try {
      const url = 'https://hanyu.baidu.com/s?wd=' + encodeURI(o[0]) + '&ptype=zici'
      const html = await request({
        url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
        }
      })
      if (new RegExp(`strong>${o[0]}`, 'gm').test(html)) {
        log.start(data => `${checkData.length}/${number} ${data.frame} ${++checkCount} checking the validity of words`)
        return o
      }
    } catch (e) {}
  })
  return Promise.all(ps)
}

function slice(n) {
  if (!slice.index) slice.index = 0
  return wordList.slice(slice.index, slice.index += n)
}


function progress(text) {
  log.clear()
  console.log(chalk.green(`√ ${text}`))
}