function parseRule (rule: string, $: cheerio.Root): cheerio.Cheerio | string {
  if (!rule) return ''
  const [parseRules, regexRule] = rule.split('#')
  const parseRuleList = parseRules.split(/\|\|?/)
  for (let parseRule of parseRuleList) {
    const rules = parseRule.split('@')
    let ret: ReturnType<typeof simpleParser> | cheerio.Root = $
    rules.forEach((r) => {
      if(ret && typeof ret !== "string") {
        ret = simpleParser(r, ret)
      }
    })
    if (regexRule) {
      const regexRules = regexRule.split('|')
      regexRules.forEach(r => {
        if(typeof ret === 'string'){
          ret = parseRegex(ret, r)
        }
      })
    }
    if(ret && ret.length > 0) {
      return ret as any as cheerio.Cheerio | string
    }
  }
  return ''
}

function parseRegex (text: string, regex: string) {
  const reg = new RegExp(regex)
  return text.replace(reg, '')
}

function selectorParse (rule: string[], $: cheerio.Cheerio | cheerio.Root, prefix = '') {
  const [tag, index] = rule[1].split('!')
  if (typeof $ === 'function') {
    $ = $(prefix + tag)
  } else {
    $ = $.find(prefix + tag)
  }
  if (index) {
    $ = $.filter(i => {
      return i > Number(index)
    })
  } else if (rule[2]) {
    $ = $.eq(Number(rule[2]))
  }
  return $
}

function simpleParser (rule: string, $: cheerio.Root | cheerio.Cheerio) {
  const rules = rule.split('.')
  let ret: cheerio.Cheerio | string | undefined | null
  switch (rules[0]) {
    case 'class':
      ret = selectorParse(rules, $, '.')
      break
    case 'id':
      ret = selectorParse(rules, $, '#')
      break
    case 'tag':
      ret = selectorParse(rules, $, '')
      break
  }
  if('cheerio' in $) {
    switch (rules[0]) {
      case 'class':
      case 'id':
      case 'tag':
        break
      case 'text':
        ret = $.text()
        break
      case 'href':
      case 'src':
        ret = $.attr(rules[0])
        break
      case 'html':
        ret = $.html()
        break
      case 'textNodes':
        {
          ret = handleTextNodes($)
        }
        break
      default:
        throw new Error('unkonw rule: ' + rule)
    }
  }
  return ret
}

function handleTextNodes(parent: cheerio.Cheerio){
  const temp: string[] = [];
  parent.contents().each((index, element) => {
    // if (element.type === 'tag' && ['br', 'a'].includes(element.name)) {
    //   console.log(element)
    // } else {
    //   const content = String.prototype.trim.apply($(element).text());
    //   content && (temp.push('    ' + content));
    // }
    if (element.type === 'text') {
      const content = String.prototype.trim.apply(element.data);
      content && (temp.push('    ' + content));
    }else if(element.type === 'tag' && ['p'].includes(element.name)) {
      const content = String.prototype.trim.apply($(element).text());
       content && (temp.push('    ' + content));
    }
  });
  return temp.join('\n');
}

export {
  handleTextNodes,
  parseRule
}
