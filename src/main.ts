import Reader from "./reader"
import inquirer from "inquirer";

export function dispatch(argv: any) {
  if(typeof argv.read === 'string' && argv.read.startsWith("http")) {
    let line = 1
    if(argv.N > 1) {
      line = Number(argv.N)
    }
    
    inquirer.registerPrompt("novel", Reader)
    inquirer.prompt([{
      type: "novel",
      name: "read novel",
      url: argv.read,
      line
    }]).then(() => {}) 
  } else {
    console.error("please input a url")
  }
}