import { GeneralParser } from './parser/general';
import { readSourcesSync } from './utils';
import { RuleParser } from './parser/rule';

export function getParser(url: string) {
  const sources = readSourcesSync()
  const source = sources.find(source => url.startsWith(source.bookSourceUrl))
  if (source) {
    return new RuleParser(source)
  }
  return new GeneralParser()
}
