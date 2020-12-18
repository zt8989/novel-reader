import readline, { ReadLine } from "readline";
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import eol from 'eol'
import ScreenManager from "inquirer/lib/utils/screen-manager";
import Base from "inquirer/lib/prompts/base";
import inquirer from "inquirer";
import observe from "inquirer/lib/utils/events";
import cliCursor from 'cli-cursor'
import chalk from 'chalk'

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
  private count = 0
  private line = 1
  private lines: string[] = []
  private index: { next?: string, prev?: string } = { }
  private url: string = ""
  private prevLines = 0
  private done?: Function
  private firstRender = true
  private title: string = ""

  constructor(question: any, readLine: ReadLine, answers: inquirer.Answers) {
    super(question, readLine, answers)

    this.url = question.url
    this.line = question.line
    // readline.emitKeypressEvents(process.stdin);
    // if (process.stdin.isTTY){
    //   // @ts-ignore
    //   process.stdin.setRawMode(true);
    // }
    // process.stdin.on('keypress', (c: string, k) => {
    //   const key = c.toLowerCase()
    //   switch (key) {
    //     case 'h':
    //       break
    //     case 'j':
          // if(!this.isEnd()) {
          //   this.count += this.line
          //   this.render()
          // } else {
          //   if(this.index.next){
          //     if(this.index.next.startsWith("http")) {
          //       this._read(this.index.next)
          //     } else {
          //       const urlObj = new URL(this.url)
          //       this._read(urlObj.origin + this.index.next)
          //     }
          //   } else {
          //     this.lines = ['提示:', '没有下一页了', 'thank you']
          //     this.render()
          //   }
          // }
    //       break
    //     case 'k':
    //       if(this.isHead()) {
    //         if(this.index.prev){
    //           if(this.index.prev.startsWith("http")) {
    //             this._read(this.index.prev)
    //           } else {
    //             const urlObj = new URL(this.url)
    //             this._read(urlObj.origin + this.index.prev)
    //           }
    //         } else {
    //           this.lines = ['提示:', '没有上一页了', 'thank you']
    //           this.render()
    //         }
    //       } else {
    //         if(this.count < this.line) {
    //           this.count = 0
    //         } else {
    //           this.count -= this.line
    //         }
    //         this.render()
    //       }
    //       break
    //     case 'l':
    //       break
    //   }
    //   return
    // })
  }

    /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  _run(cb: Function) {
    this.done = cb;

    var events = observe(this.rl);

    events.normalizedUpKey
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .forEach(this.onDownKey.bind(this));

    // Init the prompt
    cliCursor.hide();
    // this.render();
    this._read(this.url)
    this.firstRender = false;

    return this;
  }

  onUpKey() {
    this.render();
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
          const urlObj = new URL(this.url)
          this._read(urlObj.origin + this.index.next)
        }
      } else {
        this.lines = ['提示:', '没有下一页了', 'thank you']
        this.render()
      }
    }
  }

  read(url: string){
    this._read(url)
  }

  private _read(url: string){
    this.url = url
    this.count = 0
    // const spinner = ora("start loading " + url).start()
    parseNovel(url).then(res => {
      this.lines = eol.split(res.content)
      this.index = res.index
      this.title = res.title
      // spinner.succeed()
      this.render()
    })
  }

  async render() {
    // for (let i = 0;i < this.prevLines; i++){
    //   readline.clearLine(process.stdin, 0)
    //   if(i < this.prevLines - 1){
    //     readline.moveCursor(process.stdin, 0, -1)
    //   }
    // }
    // readline.cursorTo(process.stdin, 0)
    const lines = this.lines.slice(this.count, this.count + this.line)
    this.prevLines = lines.length
    // console.log(this.prevLines)

    this.screen.render(lines.join("\n"), chalk.gray(this.title))
  }

  isEnd() {
    return (this.count + this.line) > this.lines.length
  }

  isHead() {
    return this.count === 0
  }
}