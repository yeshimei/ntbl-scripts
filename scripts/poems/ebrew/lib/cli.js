#!/usr/bin/env node
'use strict'

const path = require('path')
const fs = require('mz/fs')

const args = process.argv.slice(2)
const yargs = require('yargs/yargs')(args)


const argv = yargs
  .usage('usage: $0 <command> [options]')
  .alias('v', 'version')
  .help()
  .alias('h', 'help')

  .command('init', 'Runs an interactive wizard for creating a new book.json manifest.', {}, init)

  .command('make [output]', 'Generates an EPUB file from the given manifest.', {
    output: {
      alias: 'o',
      string: true,
      default: process.stdout.isTTY ? '' : '-',
      describe: 'Path to the output file. Pass - for standard output.',
    },
    input: {
      alias: 'i',
      default: process.stdin.isTTY ? './book.json' : '-',
      describe: 'Path to the book manifest. Pass - for standard input.',
      string: true,
    },
  }, make)

  .epilogue('See https://npm.im/ebrew for further documentation.')
  .argv

const command = yargs.getCommandInstance()
if (command.getCommands().length) {
  args.unshift('make')
  command.runCommand('make', yargs, yargs.parsed)
}

function init(argv) {
  require('./init')()
  .catch(e => console.error(e.stack))
}

function make(argv) {
  require('..').generate(argv.input, argv.output)
  .then(output => {
    if (output === '-') return
    const relative = path.relative(process.cwd(), output)
    const o = relative.startsWith('../') ? path.resolve(output) : relative
    console.error(`Generated ${o}`)
  }, e => console.error(e.stack))
}
