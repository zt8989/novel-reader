export type ParserReturnType = {
  index: { next?: string, prev?: string}
  content: string
  title: string
}

export type ParserOptions = {
  raw?: boolean
}

export interface IParser {
  parseNovel: (url: string, options: ParserOptions) => Promise<ParserReturnType>
}