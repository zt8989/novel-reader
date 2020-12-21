export type ParserReturnType = {
  index: { next?: string, prev?: string}
  content: string
  title: string
}

export interface IParser {
  parseNovel(url: string): Promise<ParserReturnType>
}