## 小说解析算法解释

```typescript
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

```

父元素的文字长度为`size`。
遍历每个子元素，取得文字长度`length`。
如果`(size - length) / size`值最小, 既斜率最小, 则当前子元素文字最多。
计算方差`tempVariance`, 如果方差值>`100`(经验值)，则表示所有子元素的差异很大，取最大的子元素重新计算。
否则表示这个父元素所有的子元素差异很小（如果是小说的话，每个段落不会差很多），将父元素作为正文返回。
