

# text-check

查询文本中的高频词。

![](https://yeshimei.oss-cn-beijing.aliyuncs.com/20200524162521.gif)

# installation

```bash
$ npm i @ntbl/scripts-text-check -g
```

## Usage

**text-check [OPTIONS] INPUT [OUTPUT]**
- `-n, --number <n>` - 保留前 n 个词语。如果保存所有的词语请指定为 0，默认为 10 个 
- `-l, --lengths <n>`, 检查词语的长度，指定多个时以冒号分隔，默认为 2:3:4

