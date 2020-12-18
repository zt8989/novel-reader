import program from 'commander'
import { dispatch } from './main'

program
  .version(require("../package.json").version)
  .option("read <url>", "read from url")
  .option("-n [line] <url>", "set the line number")
  .action(dispatch)

program.parse(process.argv)