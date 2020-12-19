import os from "os"
import path from "path"
import fs from 'fs'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const historyFile = path.resolve(os.homedir(), ".novel_history")

export type ConfigType = {
    lastUrl?: string
    lastLine?: number
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