import fetch from 'node-fetch';
import cheerio from 'cheerio';
const gbk = require('gbk.js');

function fetchUrl(url: string) {
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
function parseContent(doc: string) {
  const $ = cheerio.load(doc, { decodeEntities: false });

  function parseChildren(parent: cheerio.Cheerio, size: number, slope: number, variance: number): string {
    let maxChildren: { element: cheerio.Cheerio; size: number; slope: number; };
    const sizeList: number[] = [];
    parent.children().each((index, element) => {
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
    // console.log(sizeList)
    let avg = sizeList.reduce((sum, x) => sum + x, 0) / sizeList.length;
    // 计算方差
    let tempVariance = Math.sqrt(sizeList.reduce((sum, x) => sum + (x - avg) ** 2, 0) / sizeList.length);
    // console.log(avg, tempVariance)
    // @ts-ignore
    if (maxChildren) {
      // console.log('---', maxChildren.element.html(), maxChildren.element[0].name)
      if (maxChildren.slope < (slope) || (tempVariance < variance && tempVariance > 0)) {
        return parseChildren(maxChildren.element, maxChildren.size, maxChildren.slope, tempVariance);
      } else {
        const temp: string[] = [];
        parent.contents().each((index, element) => {
          if (element.type === 'text') {
            const content = String.prototype.trim.apply(element.data);
            content && (temp.push('    ' + content));
          }
        });
        return temp.join('\n');
      }
    } else {
      return "";
    }
  }

  return parseChildren($('body'), $('body').text().length, 1, $('body').text().length);
}
function parseIndexChapter(doc: string) {
  const $ = cheerio.load(doc, { decodeEntities: false });

  const next = $('body').find('a:contains("下一章")');
  const nextHref = next.attr("href");
  const prev = $('body').find('a:contains("上一章")');
  const prevHref = prev.attr("href");
  return { next: nextHref, prev: prevHref };
}

function parseTitle(doc: string) {
  const $ = cheerio.load(doc, { decodeEntities: false });

  return $('title').text();
}

export async function parseNovel(url: string) {
  // console.log('fetching...', url)
  const doc = await fetchUrl(url);
  const content = parseContent(doc);
  const index = parseIndexChapter(doc);
  const title = parseTitle(doc);
  return { index, content, title };
}
