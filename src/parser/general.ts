import { IParser } from './index';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { handleTextNodes } from './parser';
const gbk = require('gbk.js');
const debug = require('debug')('parser')

export class GeneralParser implements IParser {

  protected async fetchUrl(url: string) {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    };
  
    return fetch(url, {
      headers
    })
      .then(res => res.buffer())
      .then(res => {
        if (res.includes('gbk') || res.includes('gb2312')) {
          return gbk.decode(res);
        }
        return res.toString('utf-8');
      });
  }
  /**
   * 解析内容
   * @param doc
   */
  protected async parseContent(doc: string) {
    const $ = cheerio.load(doc, { decodeEntities: false });
  
    function parseChildren(parent: cheerio.Cheerio, size: number, slope: number, variance: number): string {
      const children = parent.children()
      if(children.length === 1) {
        return parseChildren(children, size, slope, variance)
      } 
      let maxChildren: { element: cheerio.Cheerio; size: number; slope: number; };
      const sizeList: number[] = [];
      children.each((index, element) => {
        const wrapperElement = $(element);
        const length = wrapperElement.text().length;
        sizeList.push(length);
        const tempSlop = (size - length) / size;
        if (!maxChildren) {
          maxChildren = {
            element: wrapperElement,
            size: length,
            slope: tempSlop
          };
        } else if (tempSlop < (maxChildren.slope)) { // 保存最小斜率
          maxChildren = {
            element: wrapperElement,
            size: length,
            slope: tempSlop
          };
        }
      });
      // debug(sizeList)
      let avg = sizeList.reduce((sum, x) => sum + x, 0) / sizeList.length;
      // 计算方差
      let tempVariance = Math.sqrt(sizeList.reduce((sum, x) => sum + (x - avg) ** 2, 0) / sizeList.length);
      // debug(avg, tempVariance)
      // @ts-ignore
      if (maxChildren) {
        // console.log('---', maxChildren.element.html(), maxChildren.element[0].name)
        debug(maxChildren.element.text(), maxChildren.slope, slope, tempVariance, variance)
        if (tempVariance > 100) {
          return parseChildren(maxChildren.element, maxChildren.size, maxChildren.slope, tempVariance);
        } else {
         return handleTextNodes(parent)
        }
      } else {
        return "";
      }
    }
  
    return parseChildren($('body'), $('body').text().length, 1, $('body').text().length);
  }

  protected async parseIndexChapter(doc: string) {
    const $ = cheerio.load(doc, { decodeEntities: false });
  
    const nextHref = await this.parseNextPage($)
    const prevHref = await this.parsePrevPage($)
    return { next: nextHref, prev: prevHref };
  }

  protected async parsePrevPage($: cheerio.Root) {
    const prevHref = $('body').find('a:contains("上一章")').attr("href") || $('body').find('a:contains("上一页")').attr("href");
    return prevHref
  }

  protected async parseNextPage($: cheerio.Root){
    const nextHref = $('body').find('a:contains("下一章")').attr("href") || $('body').find('a:contains("下一页")').attr("href");
    return nextHref
  }
  
  protected async parseTitle(doc: string) {
    const $ = cheerio.load(doc, { decodeEntities: false });
  
    return $('title').text();
  }

  parseNovel = async (url: string) => {
    // console.log('fetching...', url)
    const doc = await this.fetchUrl(url);
    const content = await this.parseContent(doc);
    const index = await this.parseIndexChapter(doc);
    const title = await this.parseTitle(doc);
    return { index, content, title };
  }

}