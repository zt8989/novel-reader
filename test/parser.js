const parser = require('../dist/parser')
const utils = require('../dist/utils');

let urls = [
  'https://www.daxuetian.com/xs/2/2511.html',
  'http://www.yunxs.com/xintengjiejie/252578.html',
  'http://www.xbiquge.la/26/26874/13244872.html',
  'https://www.oldtimescc.cc/go/37136/19989330.html',
  'https://www.sikushu8.com/5/5867/919735.html',
  'https://www.2kzw.com/42/42542/38451420.html',
  'https://www.hgq26.com/107/107229/64932812.html',
  'http://m.suixkan.com/r/218571/218572.html,'
]

;(async () => {
  for (let url of urls) {
    let res = await parser.parseNovel(url)
    let content = res.content
    const limit = 32
    const lines = utils.wordWrap(content, limit)
    console.assert(lines.length > 10, "解析失败")
    for(let line of lines) {
      console.assert(line.length <= limit, "error")
      console.log(line.length, line)
    }
    console.info(url)

  }
})()

