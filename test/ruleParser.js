const parser = require('../dist/parser');
const { RuleParser } = require('../dist/parser/rule');
const utils = require('../dist/utils');

let urls = [
  'http://www.biquku.la/2/2718/2038029.html',
]

;(async () => {
  for (let url of urls) {
    const p = parser.getParser(url)
    console.assert(p instanceof RuleParser, "rule 查找失败")
    let res = await p.parseNovel(url)
    let content = res.content
    const limit = 40
    const lines = utils.wordWrap(content, limit)
    console.assert(lines.length > 10, "解析失败")
    for(let line of lines) {
      console.assert(line.length <= limit, "error")
      console.log(line.length, line)
    }
    console.info(url)
  }
})()

