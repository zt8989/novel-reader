export type ParserReturnType = {
  index: { next?: string, prev?: string}
  content: string
  title: string
}

export interface IParser {
  parseNovel(url: string): Promise<ParserReturnType>
}

export abstract class AbstractParser implements IParser{
  protected abstract fetchUrl(url: string): Promise<string>

  protected abstract parseContent(doc: string): string

  protected abstract parseIndexChapter(doc: string): ParserReturnType["index"]

  protected abstract parseTitle(doc: string): string

  async parseNovel(url: string): Promise<ParserReturnType> {
    // console.log('fetching...', url)
    const doc = await this.fetchUrl(url);
    const content = this.parseContent(doc);
    const index = this.parseIndexChapter(doc);
    const title = this.parseTitle(doc);
    return { index, content, title };
  }
}