import { ReadLine } from "readline";
// import eol from 'eol'
import Base from "inquirer/lib/prompts/base";
import inquirer from "inquirer";
import observe from "inquirer/lib/utils/events";
import cliCursor from 'cli-cursor'
import chalk from 'chalk'
import { filter, share } from 'rxjs/operators'
import { parseNovel } from "./parser";
import { writeConfigSync, wordWrap } from "./utils";
import ConfirmPrompt from "inquirer/lib/prompts/confirm";
import { newLineSplit } from "./constants";
import { BookType, ConfigType, DataStoreDocumentType } from "./type";
import db from "./db";
import ListPrompt from "inquirer/lib/prompts/list";
import { setBook } from "./api";
import { ParserReturnType } from "./parser/index";
import CacheManager from "./cache";

export default class Reader extends Base{
  /** 阅读滚动行数 */
  private count = 0
  /** 显示行数 */
  private line = 1
  private lineNumber = 40
  private lines: string[] = []
  private index: { next?: string, prev?: string } = { }
  private url: string = ""
  private title: string = ""
  private loading = true
  private boss = false
  private config: ConfigType
  // @ts-ignore
  private firstRun = true
  private book: BookType & DataStoreDocumentType
  private cacheManageer: CacheManager;

  constructor(question: any, readLine: ReadLine, answers: inquirer.Answers) {
    super(question, readLine, answers)

    this.url = question.url
    this.line = question.line
    this.config = question.config
    // console.log(this.config)
    this.book = question.book

    this.cacheManageer = new CacheManager()

    // if (answers.continue === true && this.config.lastUrl) {
    //   this.url = this.config.lastUrl
    // }
  }

  getConfirmPrompt() {
    const prompt = new ConfirmPrompt({
      type: "confirm", 
      name: "continue",
      message: "是否继续上次的阅读？"
    }, this.rl, {});

    (prompt as any).onEnd = function onEnd(this: any, input: string) {
      this.status = 'answered';

      var output = this.opt.filter(input);
      // this.render(output);

      this.done(output);
    };

    (prompt as any).screen = this.screen

    return prompt
  }

  async getListPrompt() {
    const list = await db.books().find({})
    const prompt = new ListPrompt({
      type: "list", 
      name: "chooseBook",
      message: "选择你要阅读的书籍？",
      choices: list as any
    }, this.rl, {});

    (prompt as any).onSubmit = function onSubmit(this: any, value: any) {
      this.status = 'answered';
      this.done(value);
    };

    (prompt as any).screen = this.screen

    return prompt
  }

    /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */
  async _run(cb: Function) {

    var events = observe(this.rl);

    events.normalizedUpKey
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .forEach(this.onDownKey.bind(this));
    
    events.keypress.pipe(
      filter(({ key }) => key && key.name === 'b'),
      share()
    ).forEach(this.onBossKey.bind(this))

    events.keypress.pipe(
      filter(({ key }) => key && key.name === 'r'),
      share()
    ).forEach(this.onRefresh.bind(this))

    events.keypress.pipe(
      filter(({ key }) => key && key.name === 'l'),
      share()
    ).forEach(this.onListBook.bind(this))

    const next = (cont: Boolean = false) => {
      if(cont && this.config.lastUrl) {
        this.url = this.config.lastUrl
      }
      // Init the prompt
      cliCursor.hide();
      this._read(this.url)
    }
    if (this.firstRun && this.config.lastUrl) {
      this.getConfirmPrompt().run().then((res: boolean) => {
        // Init the prompt
        next(res)
      })
    } else if (this.book) {
      next()
    } else {
      this.onListBook()
    }
    this.firstRun = false
    return this;
  }

  onListBook(){
    this.getListPrompt().then(res => res.run()).then(res => {
      return db.books().findOne({ name: res })
    }).then((res: BookType) => {
      if(res) {
        this.book = res as any
        return this._read(res.lastUrl)
      } else {
        console.error("未找到对应的书")
        process.exit()
      }
    })
  }

  onUpKey() {
    if(this.loading) return
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

  getAbsoluteUrl(url: string) {
    if(url.startsWith("http")) {
      return url
    } else {
      const urlObj = new URL(url, this.url)
      return urlObj.href
    }
  }

  onDownKey() {
    if(this.loading) return
    if(!this.isEnd()) {
      this.count += this.line
      this.render()
    } else {
      if(this.index.next){
        this._read(this.getAbsoluteUrl(this.index.next))
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

  onRefresh(){
    if(!this.loading) {
      this._read(this.url)
    }
  }

  

  private parseNovel(url: string): Promise<ParserReturnType>{
    let item = this.cacheManageer.getItem(url)
    if(item) {
      return item
    } else {
      let value = parseNovel(url)
      this.cacheManageer.setItem(url, value)
      return value
    }
  }

  private async _read(url: string){
    this.url = url
    this.loading = true
    this.render();
    const res = await this.parseNovel(url)
    if(res.index.next) {
      this.parseNovel(this.getAbsoluteUrl(res.index.next))
    }
    if (this.book) {
      // console.log("save books")
      db.books().update({ _id: this.book._id }, { $set: { lastUrl: url }})
      this.config.token && setBook({ name: this.book.name, lastUrl: url }).catch(e => {
        if(e.code === 401) {
          delete this.config.token
        } else {
          throw e
        }
      })
    }
    this.lines = wordWrap(res.content, this.lineNumber)
    // if (this.firstRun && (this.config.lastLine || 0) < this.lines.length) {
    //   this.count = this.config.lastLine || 0
    // } else {
      this.count = 0
    // }
    this.index = res.index
    this.title = res.title
    this.loading = false
    this.render()
  }

  render() {
    if(this.boss) {
      this.screen.render("shell>", "")
    } else {
      const currentLine = this.getCurrentLine()
      const lines = this.getRenderLines(currentLine)
      const progress = Math.round(this.lines.length ? ((currentLine) / this.lines.length * 100) : 100)
      const content = lines.length > 0 ? lines.join(newLineSplit) : this.loading ? '' : "没有内容"
      const title = this.loading ? '加载中...' : chalk.gray(this.title)
      this.screen.render(content,
        progress
        + '%\t' 
        + currentLine
        + '/'
        + this.lines.length
        + '\t'
        + title)
    }
  }

  getRenderLines(currentLine: number){
    const lines = new Array(this.line).fill(" ")
    this.lines.slice(this.count, currentLine).forEach((value, index) => {
      lines[index] = value
    })
    return lines
  }

  getCurrentLine(){
    let currentLine = this.count + this.line
    if(currentLine > this.lines.length) {
      currentLine = this.lines.length
    }
    return currentLine
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