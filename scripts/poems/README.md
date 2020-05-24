

# text-check

列出古诗词的题目，为你生成一本诗集（epub 格式）

数据来自 [古诗文网](https://www.gushiwen.org/)

# installation

```bash
$ npm i @ntbl/scripts-poems -g
```

## Usage

**poems [OPTIONS] INPUT [OUTPUT]**

列出清单

```js
// list.txt

// 诗人为可选，可以进一步精确
// 由于古诗文网查询机制的问题，
// 加上诗人后可能会查询不到任何诗词
// 请谨慎使用
醉花阴·薄雾浓云愁永昼 李清照
点绛唇·蹴罢秋千
凤凰台上忆吹箫·香冷金猊
雨铃霖·寒蝉凄切
蝶恋花·伫倚危楼风细细
八声甘州·对潇潇暮雨洒江天
昼夜乐·洞房记得初相遇
水调歌头·明月几时有
念奴娇·赤壁怀古
江城子·乙卯正月二十日夜记梦
```

生成诗集

```
poems list.txt 诗集.epub
```