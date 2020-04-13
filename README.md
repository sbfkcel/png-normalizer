# png-normalizer

Apple 对 png 图片进行了 pngcrush 压缩, 此格式的图片在非 Apple 的软件内无法正常显示. 其中典型的场景就是从 .ipa 文件中提取的 icon 在除了 Safari 之外的浏览器上无法正常显示。

png-normalizer 只在 node.js 10.15.0+以上版本进过过测试。无任何依赖。

# Usage

```javascript
let pngNormailzer = require('png-normalizer'),
    result = pngNormailzer('./src.png');

if(result){
    fs.writeFileSync('./out.png',result);
};
```

# License

MIT