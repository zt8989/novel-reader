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

let usersIns: Datastore | null = null

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
  users: () => {
    if (usersIns === null) {
      usersIns = dbFactory('users')
    }
    return usersIns
  },
}
