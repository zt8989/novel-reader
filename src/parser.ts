import { GeneralParser } from './parser/general';
import { readSourcesSync } from './utils';
import { RuleParser } from './parser/rule';
import { IParser } from './parser/index';

export function parseNovel(url: string, raw = false) {
  const sources = readSourcesSync()
  const source = sources.find(source => url.startsWith(source.bookSourceUrl))
  let parser: IParser
  if (source) {
    parser =  new RuleParser(source)
  } else {
    parser = new GeneralParser()
  }
  return parser.parseNovel(url, { raw })
}
