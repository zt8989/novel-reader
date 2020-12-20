import { AbstractParser } from './index';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { SourceType } from '../utils';
import { parseRule } from './parser'
const gbk = require('gbk.js');
const debug = require('debug')('parser')

export class RuleParser extends AbstractParser {
  private source: SourceType

  constructor(source: SourceType) {
    super()
    this.source = source
  }

  fetchUrl(url: string) {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    };
  
    return fetch(url, {
      headers
    })
      .then(res => res.buffer())
      .then(res => {
        if (res.includes('gbk')) {
          return gbk.decode(res);
        }
        return res.toString('utf-8');
      });
  }
  /**
   * 解析内容
   * @param doc
   */
  parseContent(doc: string) {
    const $ = cheerio.load(doc, { decodeEntities: false })
    return parseRule(this.source.ruleBookContent, $) as string
  }

  parseIndexChapter(doc: string) {
    const $ = cheerio.load(doc, { decodeEntities: false });
  
    const nextHref = parseRule(this.source.ruleNextPage, $) as string
    const prevHref = parseRule(this.source.rulePrevPage, $) as string
    return { next: nextHref, prev: prevHref };
  }
  
  parseTitle(doc: string) {
    const $ = cheerio.load(doc, { decodeEntities: false });
    
    return parseRule(this.source.ruleTitle, $) as string
  }

}