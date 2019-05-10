
# searchWiki

一个把文本词汇变成 markdown 添上搜索百度百科的链接和简介的脚本。

![](https://github.com/yeshimei/ntbl-scripts/blob/master/images/2wknu-92xtn.gif?raw=true)


# installation

```bash
$ npm i @ntbl/scripts-search-wiki -g
```


## Usage

**search-wiki [OPTIONS] INPUT [OUTPUT]**
- `-f，--format [name]`  输入文本的处理格式，可选值（'掌阅'）
- `-t, --text [content]` 在命令行输入词语并打印，多个时以冒号分隔

## Example

```js
// word.txt

智人
尼安德特人
```

```bash
$ search-wiki word.txt
```

```markdown
<!-- word.md -->

- [**智人**](https://baike.baidu.com/item/%E6%99%BA%E4%BA%BA) - 智人（学名：Homo sapiens），是人属下的唯一现存物种。形态特征比直立人更为进步。分为早期智人和晚期智人。早期智人过去曾叫古人，生活在距今25万～4万年前，主要特征是脑容量大，在1300毫升以上；眉嵴发达，前额较倾斜，枕部突出，鼻部宽扁，颌部前突。一般认为是由直立人进化来的，但有争议认为直立人被后来崛起的智人（现代人）走出非洲后灭绝或在此之前就灭绝了。晚期智人（新人）是解剖结构上的现代人。大约从距今四五万年前开始出现。两者形态上的主要差别在于前部牙齿和面部减小，眉嵴减弱，颅高增大，到现代人则更加明显。晚期智人臂不过膝，体毛退化，有语言和劳动，有社会性和阶级性。
- [**尼安德特人**](https://baike.baidu.com/item/%E5%B0%BC%E5%AE%89%E5%BE%B7%E7%89%B9%E4%BA%BA) - 尼安德特人（Homo neanderthalensis），简称尼人，也被译为尼安德塔人，常作为人类进化史中间阶段的代表性居群的通称。因其化石发现于德国尼安德特山谷而得名。
```

或者，使用 `-t` 选择在命令行直接输入文本。

```bash
$ search-wiki -t 智人:尼安德特人
```
