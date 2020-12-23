import fetch, { RequestInit } from 'node-fetch'
import { BookType } from './type'
import { readConfig, SourceType } from './utils'

const request = async (url: string, options: RequestInit, auth = true) => {
  const config = await readConfig()
  if (!config.baseUrl || !config.baseUrl.startsWith("http")) {
    throw new Error("请使用nvrd config -a <url>设置api接口")
  }
  if (auth && !config.token) {
    throw new Error("请使用nvrd login登录")
  }
  if(auth) {
    if (!options.headers) {
      options.headers = {}
    }
    // @ts-ignore
    options.headers['Authorization'] = 'Bearer ' + config.token
  }
  // console.log(options)
  const baseUrl = config.baseUrl
  const res = await fetch(baseUrl + url, options).then(res => res.json())
  if(res.code === 200) {
    return res.data
  } else {
    const error = new Error(res.message)
    // @ts-ignore
    error.code = res.code
    throw error
  }
}

export const login = (data: { username: string, password: string }) => {
  return request('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)}, false)
}

export const getBooks = (): Promise<BookType[]> => {
  return request('/books', {})
}

export const setBooks = (data: BookType[]) => {
  return request('/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)})
}

export const getSources = (): Promise<SourceType[]> => {
  return request('/sources', {} )
}

export const setSources = (data: SourceType[]) => {
  return request('/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)})
}