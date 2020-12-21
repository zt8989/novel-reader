import cheerio from 'cheerio';
import { SourceType } from '../utils';
import { parseRule } from './parser'
import { GeneralParser } from './general';

export class RuleParser extends GeneralParser {
  private source: SourceType

  constructor(source: SourceType) {
    super()
    this.source = source
  }

  /**
   * 解析内容
   * @param doc
   */
  protected async parseContent(doc: string) {
    if(this.source.ruleBookContent) {
      const $ = cheerio.load(doc, { decodeEntities: false })
      return parseRule(this.source.ruleBookContent, $('body'), $) as string
    } else {
      return super.parseContent(doc)
    }
  }

  protected async parsePrevPage($: cheerio.Root) {
    if(this.source.rulePrevPage) {
      return parseRule(this.source.rulePrevPage, $('body'), $) as string
    } else {
      return super.parsePrevPage($)
    }
  }

  protected async parseNextPage($: cheerio.Root){
    if(this.source.ruleNextPage) {
      return parseRule(this.source.ruleNextPage, $('body'), $) as string
    } else {
      return super.parseNextPage($)
    }
  } 
  
  protected async parseTitle(doc: string) {
    if(this.source.ruleBookTitle) {
      const $ = cheerio.load(doc, { decodeEntities: false });
      return parseRule(this.source.ruleBookTitle, $('body'), $) as string
    } else {
      return super.parseTitle(doc)
    }
  }

}