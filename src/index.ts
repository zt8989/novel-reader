#!/usr/bin/env node

import program from 'commander'
import { readAction, bookAction, sourceAction } from './main'

program
  .version(require("../package.json").version)

program.command("read <url>")
  .description("read from url")
  .option("-n [line]", "set the line number")
  .action(readAction)

program.command("book")
  .description("book manage")
  .option("-l, --list", "list books")
  .option("-r, --read <name>", "list books")
  .option("-a, --add <name> <url>", "add a book")
  .option("--remove <name>", "remove a book")
  .option("-s, --set-url <name> <url>")
  .option("-n [line]", "set the line number")
  .action(bookAction)

program.command("source")
  .description("source manage")
  .option("-l, --list", "list sources")
  .option("-a, --add <name> <json>", "add a source")
  .option("-r, --remove <name>", "remove a source")
  .option("-s, --set <name> <json>", "modify a source")
  .action(sourceAction)

program.command("config")
  .description("config manage")
  .option("-n, --number", "set line numer")

program.parse(process.argv)