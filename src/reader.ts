import { ReadLine } from "readline";
// import eol from 'eol'
import Base from "inquirer/lib/prompts/base";
import inquirer from "inquirer";
import observe from "inquirer/lib/utils/events";
import cliCursor from 'cli-cursor'
import chalk from 'chalk'
import { filter, share } from 'rxjs/operators'
import { parseNovel } from "./parser";
import { ConfigType, writeConfigSync } from "./utils";

function wordWrap(str: string, maxWidth: number) {
  var newLineStr = "\n"; 
  let res = '';
  while (str.length > maxWidth) {                 
    res += [str.slice(0, maxWidth), newLineStr].join('');
    str = str.slice(maxWidth);
  }

  return res + str;
}

export default class Reader extends Base{
  /** 阅读滚动行数 */
  private count = 0
  /** 显示行数 */
  private line = 1
  private lineNumber = 50
  private lines: string[] = []
  private index: { next?: string, prev?: string } = { }
  private url: string = ""
  private title: string = ""
  private loading = true
  private boss = false
  private config: ConfigType
  private firstRun = true

  constructor(question: any, readLine: ReadLine, answers: inquirer.Answers) {
    super(question, readLine, answers)

    this.url = question.url
    this.line = question.line
    this.config = question.config

    if (answers.continue === true && this.config.lastUrl) {
      this.url = this.config.lastUrl
    }
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
    this._read(this.url).then(() => {
      this.firstRun = false
    })

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
    this.loading = true
    this.render();
    return parseNovel(url).then(res => {
      this.lines = wordWrap(res.content, this.lineNumber).split('\n')
      if (this.firstRun && (this.config.lastLine || 0) < this.lines.length) {
        this.count = this.config.lastLine || 0
      } else {
        this.count = 0
      }
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

  close(){
    super.close()
    writeConfigSync({ ...this.config, lastUrl: this.url, lastLine: this.count })
  }

  isEnd() {
    return (this.count + this.line) >= this.lines.length
  }

  isHead() {
    return this.count === 0
  }
}