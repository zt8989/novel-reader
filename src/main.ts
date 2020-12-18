import Reader from "./reader"

export function dispatch(argv: any) {
  if(typeof argv.read === 'string' && argv.read.startsWith("http")) {
    let line = 1
    if(argv.N > 1) {
      line = Number(argv.N)
    }
    const reader = new Reader(line)
    reader.read(argv.read)
  } else {
    console.error("please input a url")
  }
}