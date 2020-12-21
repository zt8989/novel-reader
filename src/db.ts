import { join } from 'path'
import Datastore from 'nedb-promises'
import os from "os"

function dbFactory(fileName: string){
  return Datastore.create({
    filename: join(os.homedir(), `/.nvrd/${fileName}.db`),
    timestampData: true,
    autoload: true
  })
}

let novelsIns: Datastore | null = null

let sourcesIns: Datastore | null = null

let configIns: Datastore | null = null

export default {
  sources: () => { 
    if (sourcesIns === null) {
      sourcesIns = dbFactory('sources')
    }
    return sourcesIns
  },
  books: () => {
    if (novelsIns === null) {
      novelsIns = dbFactory('books')
    }
    return novelsIns
  },
  config: () => {
    if (configIns === null) {
      configIns = dbFactory('config')
    }
    return configIns
  },
}
