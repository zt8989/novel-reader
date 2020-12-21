import { scriptEndTag, scriptStartTag, newLineSplit } from "../constants"
import cheerio from 'cheerio'
import fetch from 'node-fetch'


function parseRule (rule: string, $: cheerio.Cheerio, root: cheerio.Root): cheerio.Cheerio | string | Promise<string> {
  if (!rule) return ''

  if (rule.startsWith(scriptStartTag) && rule.endsWith(scriptEndTag)) {
    return parseScript(rule.slice(scriptStartTag.length, rule.length - scriptEndTag.length), root)
  }

  const index = rule.indexOf("##")
  const parseRules = index === - 1 ? rule : rule.slice(0, index)
  const regexRule = index === - 1 ? "": rule.slice(index + 2)

  if(parseRules.includes("||") && parseRules.includes("&&")) {
    throw new Error("不允许同时存在&&和||规则")
  }

  if (rule.includes("&&")) {
    const parseRuleListAnd = parseRules.split("&&")
    const temp: string[] = []
    for (let parseRule of parseRuleListAnd) {
      const rules = parseRule.split('@')
      let ret: ReturnType<typeof simpleParser> = $
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
        temp.push(ret as any as string)
      }
    }
    return temp.join(newLineSplit)
  } else {
    const parseRuleListOr = parseRules.split("||")
    for (let parseRule of parseRuleListOr) {
      const rules = parseRule.split('@')
      let ret: ReturnType<typeof simpleParser> = $
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
  }
  
  return ''
}

function parseScript(script: string, $: cheerio.Root): Promise<string> {
  const func = new Function("$", "fetch", "next", script)
  return new Promise((resovle) => func($, fetch, resovle))
}

function parseRegex (text: string, regex: string) {
  const reg = new RegExp(regex, "g")
  return text.replace(reg, '')
}

function selectorParse (rule: string[], $: cheerio.Cheerio, prefix = '') {
  const [tag, indexs] = rule[1].split('!')
  let indexList: number[] = []
  if(indexs) {
      indexList = indexs.split(":").map(x => Number(x));
  }

  $ = $.find(prefix + tag)
  if (indexs) {
    indexList = indexList.map(val => {
      if(val >= 0) {
        return val
      } else {
        return $.length + val
      }
    })
    $ = $.filter(i => {
      return !indexList.includes(i)
    })
  } else if (rule[2]) {
    $ = $.eq(Number(rule[2]))
  }
  return $
}

function simpleParser (rule: string, $: cheerio.Cheerio) {
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
    if (element.type === 'text') {
      const content = String.prototype.trim.apply(element.data);
      content && (temp.push('    ' + content));
    } else if(element.type === 'tag' && ["p"].includes(element.name)) {
      const content = String.prototype.trim.apply(cheerio(element).text());
      content && (temp.push('    ' + content));
    }
  });
  return temp.join(newLineSplit);
}

export {
  handleTextNodes,
  parseRule
}
