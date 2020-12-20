import os from "os"
import path from "path"
import fs from 'fs'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const historyFile = path.resolve(os.homedir(), ".novel_history")

const sourcesFile = path.resolve(os.homedir(), "novel_sources.json")

export type ConfigType = {
    lastUrl?: string
    lastLine?: number
}

export type SourceType = {
    bookSourceUrl: string,
    ruleBookContent: string,
    ruleNextPage: string
    rulePrevPage: string
    ruleTitle: string
}

export async function readConfig(): Promise<ConfigType> {
    if (!fs.existsSync(historyFile)) {
        await writeConfig({})
        return {}
    } else {
        try {
            const json = await readFile(historyFile, { encoding: 'utf-8'})
            return JSON.parse(json)
        } catch (e){
            return {}
        }
    }
}

export async function writeConfig(config: ConfigType) {
    return await writeFile(historyFile, JSON.stringify(config), { encoding: 'utf-8'})
}

export function writeConfigSync(config: ConfigType) {
    return fs.writeFileSync(historyFile, JSON.stringify(config), { encoding: 'utf-8'})
}

export function readSourcesSync(): SourceType[] {
    if (!fs.existsSync(sourcesFile)) {
        return []
    } else {
        try {
            const json = fs.readFileSync(sourcesFile, { encoding: 'utf-8'})
            return JSON.parse(json)
        } catch (e){
            return []
        }
    }
}

export async function readSources(): Promise<SourceType[]> {
    if (!fs.existsSync(sourcesFile)) {
        return []
    } else {
        try {
            const json = await readFile(sourcesFile, { encoding: 'utf-8'})
            return JSON.parse(json)
        } catch (e){
            return []
        }
    }
}

export async function writeSources(sources: SourceType[]) {
    return await writeFile(sourcesFile, JSON.stringify(sources), { encoding: 'utf-8'})
}

export function wordWrap(str: string, maxWidth: number) {
    var newLineStr = "\n"; 
    const lines = str.split(newLineStr)
    const newLines: string[] = []
    for (let line of lines) {
      if(line.length <= maxWidth) {
        if(line.trim()){
            newLines.push(line)
        }
      } else {
        do {
            newLines.push(line.slice(0, maxWidth))
            line = line.slice(maxWidth)
        } while(line.length > 0)
      }
    }

    console.log(newLines)

    return newLines
  }