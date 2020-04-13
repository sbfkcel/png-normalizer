# png-normalizer

Xcode在开启『Xcode Compress PNG Files』选项后，将会对 png 图片进行 pngcrush 压缩, 此格式的图片在非苹果软件内无法正常显示或编辑。

png-normalizer 无任何依赖！只在 node.js 10.15.0+以上版本进过测试。

---

After Xcode opens the "Xcode Compress PNG Files" option, it will pngcrush the png pictures, and pictures in this format cannot be displayed or edited normally in non-Apple software.

png-normalizer has no dependencies! Only tested on node.js 10.15.0+ and above.


# Usage

```javascript
let pngNormailzer = require('png-normalizer'),
    newBuf = pngNormailzer('./src.png');

if(newBuf){
    fs.writeFileSync('./out.png',newBuf);
};
```

# Related

- [iPhone PNG Images Normalizer](https://axelbrz.com/?mod=iphone-png-images-normalizer)
- [IPA-PNG-Images-Normalizer](https://github.com/ycace/IPA-PNG-Images-Normalizer/blob/master/ipin.py)

# License

MIT