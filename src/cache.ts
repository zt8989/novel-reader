import { ParserReturnType } from "./parser/index";

export default class CacheManager {
  private cache: { url: string, value: Promise<ParserReturnType> }[] = []

  setItem(url: string, value: Promise<ParserReturnType>){
    this.cache.push({ url, value })
  }

  getItem(url: string) {
    return this.cache.find(x => x.url === url)?.value || null
  }

  removeItem(url: string) {
    const index = this.cache.findIndex(x => x.url === url)
    if(index !== -1){
      this.cache.splice(index, 1)
    }
  }
}