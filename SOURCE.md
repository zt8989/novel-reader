# 源规则

目前支持两种采集源规则，一种简易规则，另一种js规则

## 源文件

将`novel_sources.json`文件放在home目录下的.nvrd目录，
`novel_sources.json`是一个json数组
可以在`demo/novel_sources.json`下查看

### 规则字段说明

* `bookSourceUrl` 书源地址
* `ruleBookContent` 文本内容规则
*  `rulePrevPage` 上一章规则
*  `ruleNextPage` 下一章规则
*  `ruleBookTitle` 标题规则

## 简易规则

具体可以查看
[阅读源规则](https://alanskycn.gitee.io/teachme/Rule/source.html)

只支持JSOUP之Default语法规则

## js规则

如果规则已`<js>`开头`</js>`结尾，则为js规则

js接受三个参数`$`,`fetch`,`next`,返回结果必须调用`next`

* `$` `cheerio`实例
* `fetch` `node-fetch`实例
* `next` 回调，进入下一步

> 例如
```javascript
<js>next($('#content').text())</js>
```