import { ReadLine } from "readline";
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import eol from 'eol'
import Base from "inquirer/lib/prompts/base";
import inquirer from "inquirer";
import observe from "inquirer/lib/utils/events";
import cliCursor from 'cli-cursor'
import chalk from 'chalk'
import { filter, share } from 'rxjs/operators'

const gbk = require('gbk.js')

export function fetchUrl(url: string){
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
  }

  return fetch(url, {
    headers
  })
    .then(res => res.buffer())
    .then(res => {
      if(res.includes('gbk')) {
        return gbk.decode(res)
      }
      return res.toString('utf-8')
  })
}

/**
 * 解析内容
 * @param doc 
 */
function parseContent(doc: string) {
  const $ = cheerio.load(doc, { decodeEntities: false })

  function parseChildren(parent: cheerio.Cheerio, size: number, slope: number, variance: number): string {
    let maxChildren: { element: cheerio.Cheerio, size: number, slope: number }
    const sizeList: number[] = []
    parent.children().each((index, element) => {
      const wrapperElement = $(element)
      const length = wrapperElement.text().length
      sizeList.push(length)
      const tempSlop = (size - length) / size
      if(!maxChildren) {
        maxChildren = {
          element: wrapperElement,
          size: length,
          slope: tempSlop
        }
      } else if(tempSlop < (maxChildren.slope)) { // 保存最小斜率
        maxChildren = {
          element: wrapperElement,
          size: length,
          slope: tempSlop
        }
      } 
    })
    // console.log(sizeList)
    let avg = sizeList.reduce((sum, x) => sum + x, 0) / sizeList.length
    // 计算方差
    let tempVariance = Math.sqrt(sizeList.reduce((sum, x) => sum + (x - avg) ** 2, 0) / sizeList.length)
    // console.log(avg, tempVariance)
    // @ts-ignore
    if(maxChildren) {
      // console.log('---', maxChildren.element.html(), maxChildren.element[0].name)
      if (maxChildren.slope < (slope) || (tempVariance < variance && tempVariance > 0)) {
        return parseChildren(maxChildren.element, maxChildren.size, maxChildren.slope, tempVariance)
      } else {
        const temp: string[] = []
        parent.contents().each((index, element) => {
          if (element.type === 'text') {
            const content = String.prototype.trim.apply(element.data)
            content && (temp.push('    ' + content))
          }
        })
        return temp.join('\r\n')
      }
    } else {
      return ""
    }
  }

  return parseChildren($('body'), $('body').text().length, 1, $('body').text().length)
}


function parseIndexChapter(doc: string) {
  const $ = cheerio.load(doc, { decodeEntities: false })

  const next = $('body').find('a:contains("下一章")')
  const nextHref = next.attr("href")
  const prev = $('body').find('a:contains("上一章")')
  const prevHref = prev.attr("href")
  return { next: nextHref, prev: prevHref }
}

async function parseNovel(url: string) {
  // console.log('fetching...', url)
  const doc = await fetchUrl(url)
  const content = parseContent(doc)
  const index = parseIndexChapter(doc)
  const title = parseTitle(doc)
  return { index, content, title }
}

function parseTitle(doc: string) {
  const $ = cheerio.load(doc, { decodeEntities: false })

  return $('title').text()
}

export default class Reader extends Base{
  /** 阅读滚动行数 */
  private count = 0
  /** 显示行数 */
  private line = 1
  private lines: string[] = []
  private index: { next?: string, prev?: string } = { }
  private url: string = ""
  private title: string = ""
  private loading = true
  private boss = false

  constructor(question: any, readLine: ReadLine, answers: inquirer.Answers) {
    super(question, readLine, answers)

    this.url = question.url
    this.line = question.line
  }

    /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */
  _run(cb: Function) {

    var events = observe(this.rl);

    events.normalizedUpKey
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .forEach(this.onDownKey.bind(this));
    
    events.keypress.pipe(
      filter(({ key }) => key && key.name === 'b'),
      share()
    ).forEach(this.onBossKey.bind(this))

    // Init the prompt
    cliCursor.hide();
    this._read(this.url)

    return this;
  }

  onUpKey() {
    if(this.isHead()) {
      if(this.index.prev){
        if(this.index.prev.startsWith("http")) {
          this._read(this.index.prev)
        } else {
          const urlObj = new URL(this.index.prev, this.url)
          this._read(urlObj.href)
        }
      } else {
        this.title = '没有上一页了'
        this.render()
      }
    } else {
      if(this.count < this.line) {
        this.count = 0
      } else {
        this.count -= this.line
      }
      this.render()
    }
  }

  onDownKey() {
    if(!this.isEnd()) {
      this.count += this.line
      this.render()
    } else {
      if(this.index.next){
        if(this.index.next.startsWith("http")) {
          this._read(this.index.next)
        } else {
          const urlObj = new URL(this.index.next, this.url)
          this._read(urlObj.href)
        }
      } else {
        this.title = '没有下一页了'
        this.render()
      }
    }
  }

  onBossKey() {
    this.boss = !this.boss
    if(this.boss) {
      cliCursor.show()
    } else {
      cliCursor.hide()
    }
    this.render()
  }

  private _read(url: string){
    this.url = url
    this.count = 0
    this.loading = true
    this.render();
    parseNovel(url).then(res => {
      this.lines = eol.split(res.content)
      this.index = res.index
      this.title = res.title
      this.loading = false
      this.render()
    })
  }

  render() {
    if(this.boss) {
      this.screen.render("shell>", "")
    } else {
      const lines = this.lines.slice(this.count, this.count + this.line)
      const progress = Math.round(this.lines.length ? ((this.count + this.line) / this.lines.length * 100) : 100)
      const content = lines.length > 0 ? lines.join("\n") : this.loading ? '' : "没有内容"
      const title = this.loading ? '加载中...' : chalk.gray(this.title)
      this.screen.render(content,
        progress
        + '%\t' 
        + (this.count + this.line)
        + '/'
        + this.lines.length
        + '\t'
        + title)
    }
  }

  isEnd() {
    return (this.count + this.line) >= this.lines.length
  }

  isHead() {
    return this.count === 0
  }
}