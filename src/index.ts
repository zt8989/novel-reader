#!/usr/bin/env node

import program from 'commander'
import { readAction, bookAction, sourceAction, loginAction } from './main'
const updateNotifier = require('update-notifier');

const pkg = require('../package.json');

updateNotifier({ pkg }).notify();

program
  .version(pkg.version)

program.command("read <url>")
  .description("read from url")
  .option("-n [line]", "set the line number")
  .action(readAction)

program.command("book")
  .description("book manage")
  .option("-l, --list", "list books")
  .option("-r, --read [name]", "list books")
  .option("-a, --add <name> <url>", "add a book")
  .option("--remove <name>", "remove a book")
  .option("-s, --set-url <name> <url>")
  .option("-n [line]", "set the line number")
  .option("-u, --up", "将数据上传到服务器")
  .option("-d, --down", "将数据下载到本地")
  .action(bookAction)

program.command("source")
  .description("source manage")
  .option("-u, --up", "将数据上传到服务器")
  .option("-d, --down", "将数据下载到本地")
  .action(sourceAction)

program.command("login")
  .description("login")
  .option("-a, --api", "set api url")
  .action(loginAction)

program.parse(process.argv)