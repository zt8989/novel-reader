const parser = require('../dist/parser')

const url = ' http://www.tycqxs.com/41_41376/7327418.html'

parser.parseNovel(url).then(res => {
  let content = res.content
  let str = ''
  const limit = 50
  while(content.length > limit) {
    str += content.slice(0, limit)
    console.log(content.length, content.slice(0, limit))
    content = content.slice(limit)
  }
  console.log(content)
})

