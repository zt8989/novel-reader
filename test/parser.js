const parser = require('../dist/parser')
const utils = require('../dist/utils')

const url = 'http://www.xbiquge.la/10/10489/4535761.html'

parser.parseNovel(url).then(res => {
  let content = res.content
  const limit = 32
  const lines = utils.wordWrap(content, limit)
  for(let line of lines) {
    console.assert(line.length <= limit, "error")
    console.log(line.length, line)
  }
})

