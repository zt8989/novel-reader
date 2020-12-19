import Reader from "./reader"
import inquirer from "inquirer";
import { readConfig } from "./utils";


export async function dispatch(argv: any) {
  if(typeof argv.read === 'string' && argv.read.startsWith("http")) {
    let line = 1
    if(argv.N > 1) {
      line = Number(argv.N)
    }

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
      url: argv.read,
      config,
      line
    })
    
    inquirer.registerPrompt("novel", Reader)
    return inquirer.prompt(questions)
  } else {
    console.error("please input a url")
  }
}