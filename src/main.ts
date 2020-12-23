import Reader from "./reader"
import inquirer from "inquirer";
import { readConfig, readSources, writeConfig, writeSources } from "./utils";
import db from './db'
import { BookType, ConfigType } from "./type";
import { checkLogin, getBooks, getSources, login, setBooks, setSources, syncBooks } from "./api";



export async function readAction(...rest: any[]) {
  let argv = rest[rest.length - 1]
  const url = rest[0] || ""
  if(url.startsWith("http")) {
    let line = 1
    if(argv.N > 1) {
      line = Number(argv.N)
    }

    return await read(url, line)
  } else {
    console.error("请输入正确的网址")
  }
}

async function read(url: string, line: number = 1, skipConfig = false) {
  let config = await readConfig()

  const questions: any[] = []

  // if (config.lastUrl) {
  //   questions.push({
  //     type: "confirm", 
  //     name: "continue",
  //     message: "是否继续上次的阅读？"
  //   })
  // }

  questions.push({
    type: "novel",
    name: "read novel",
    url,
    config: config,
    line: line ? line : config.line ? config.line : 1
  })
  
  inquirer.registerPrompt("novel", Reader)
  return inquirer.prompt(questions)
}

async function readFromBook(config: ConfigType, book: BookType, line: number = 1) {
  const questions: any[] = []

  // if (config.lastUrl) {
  //   questions.push({
  //     type: "confirm", 
  //     name: "continue",
  //     message: "是否继续上次的阅读？"
  //   })
  // }

  const { lastUrl, ...rest } = config
  questions.push({
    type: "novel",
    name: "read novel",
    url: book ? book.lastUrl : "",
    config: rest,
    book: book,
    line: line ? line : config.line ? config.line : 1
  })
  
  inquirer.registerPrompt("novel", Reader)
  return inquirer.prompt(questions)
}

export async function bookAction(...rest: any[]){
  let argv = rest[rest.length - 1]
  if(argv.list){
    let list = await db.books().find({}, { name: 1, lastUrl: 1, updatedAt: 1 })
    let newList = list.map(x => { 
      const { _id, ...rest } = x
      return rest
     })
    console.table(newList)
    return
  } 

  if(argv.add || argv['setUrl']) {
    const name = argv.add || argv['setUrl']
    if(rest.length !== 2) {
      console.error("请输入正确的参数")
      return
    }
    const url: string = rest[0] || ""
    if(!url.startsWith("http")){
      console.error("请输入正确的网址")
      return 
    }
    let result = await db.books().findOne<BookType>({ name: name })
    if (result) {
      await db.books().update<BookType>({ _id: result._id }, { $set: { lastUrl: url } })
    } else {
      await db.books().insert<BookType>({ name: name, lastUrl: url })
    }
    console.log(argv.add ? "添加成功":"更新成功")
    return
  }

  if(argv.read) {
    let line = 1
    if(argv.N > 1) {
      line = Number(argv.N)
    }
    let config = await readConfig()
    let books = await db.books().find<BookType>({})
    if (config.token) {
      await checkLogin().catch(e => {
        if(e.code === 401) {
          delete config.token
          e.message = "登录已失效"
        } 
        throw e
      })
      books = await syncBooks(books as any)
    }

    const result = books.find(x => x.name == argv.read) as BookType
    
    await readFromBook(config, result, line)
    return
  }

  if(argv.remove) {
    await db.books().remove({ name: argv.remove }, {})
    console.error("删除成功")
    return
  }

  if(argv.up) {
    const books = await db.books().find({}) as BookType[]
    await setBooks(books)
    console.log("上传成功")
    return
  }

  if(argv.down) {
    const books = await getBooks()
    await db.books().remove({}, { multi: true })
    for(let book of books) {
      await db.books().insert(book)
    }
    console.log("下载成功")
    return
  }
  
  console.error("请输入正确的参数")
}

export async function sourceAction(...rest: any[]){
  let argv = rest[rest.length - 1]

  if(argv.up) {
    const sources = await readSources()
    await setSources(sources)
    console.log("上传成功")
    return
  }

  if(argv.down) {
    const sources = await getSources()
    await writeSources(sources)
    console.log("下载成功")
    return
  }

}

export async function configAction(...rest: any[]) {
  let argv = rest[rest.length - 1]
  if(argv.api && rest[0] && rest[0].startsWith('http')) {
    const config = await readConfig()
    config.baseUrl = rest[0]
    await writeConfig(config)
    console.log("保存api成功", rest[0])
    return
  }

  if(argv.up) {
    const books = await db.books().find({}) as BookType[]
    await setBooks(books)
    const sources = await readSources()
    const res = await setSources(sources)
    console.log("上传成功", res)
    return
  }

  if(argv.down) {
    const books = await getBooks()
    await db.books().remove({}, { multi: true })
    for(let book of books) {
      await db.books().insert(book)
    }
    const sources = await getSources()
    await writeSources(sources)
    console.log("下载成功")
    return
  }
  
}

export async function loginAction(...rest: any[]) {
  let argv = rest[rest.length - 1]
  if(argv.api && rest[0] && rest[0].startsWith('http')) {
    const config = await readConfig()
    config.baseUrl = rest[0]
    await writeConfig(config)
  }

  inquirer.prompt([
    { type: 'input', 
      name: 'username',
      validate: val => !!String.prototype.trim.apply(val)
    },
    { type: 'password', 
      name: 'password',
      validate: val => !!String.prototype.trim.apply(val)
    },
  ]).then(async (answers: { username: string, password: string }) => {
    const token = await login(answers)
    const config = await readConfig()
    config.token = token
    await writeConfig(config)
    console.log("登录成功")
  }).catch(e => {
    console.error(e.message ? e.message : e)
  })
}