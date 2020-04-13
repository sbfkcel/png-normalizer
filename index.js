const fs = require('fs'),
    zlib = require('zlib'),
    crc32 = require('./crc32'),

    // 检查两组字节数据是否相等
    equalBytes = (a,b) => {
        if(a.length !== b.length){
            return false;
        };
        for(let l = a.length; l--;){
            if(a[l] !== b[l]){
                return false;
            };
        };
        return true;
    },

    // 定义PNG文件头
    pngHead = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],

    // cgbiBuffer
    cgbi = [0x43,0x67,0x42,0x49],
    
    
    // 定义字节操作类
    Byte = function(buf){
        this.buf = buf;
        this.pos = 0;

        // 定义读取方法
        Byte.prototype.read = length => {
            let end = this.pos + length,
                result = this.buf.slice(this.pos,end);
            this.pos = end;
            return result;
        }
    };


const pngDecode = srcPath => {
    let srcBuf = fs.readFileSync(srcPath),
        byte = new Byte(srcBuf),
        srcBufHead = byte.read(8);

    // 如果文件头不是PNG则中断后续操作
    if(!equalBytes(srcBufHead,pngHead)){
        return;
    };

    // 文件是正常的png
    if(srcBuf.indexOf(Buffer.from(cgbi)) < 0){
        console.log(1);
        return;
    };
    
    let resultArr = [srcBufHead],                           // 定义图片结果数据（先将头信息丢进来）
        chunkPos = srcBufHead.length,                       // 记录文件处理块位置（从头信息之后开始处理）
        srcBufLen = srcBuf.length,                          // 记录输入文件的总长度，以便于遍历操作
        chunkLen,                                           // 存储块长度
        chunkType,                                          // 存储块类型
        chunkData,                                          // 存储块的具体数据
        chunkCRC,                                           // 存储块的CRC校验数据
        skip,                                               // 块是否跳过处理（IDAT、CgBI块则跳过）
        width,                                              // 记录图片宽
        height,                                             // 记录图片高
        chunkIDAT = [],                                     // 存储块压缩数据 
        breakLoop;                                          // 记录是否跳出循环（IEND块结束时）                                             // 

    // 从头信息之后开始，遍历接下来的块数据
    while(chunkPos < srcBufLen){
        skip = false;

        // 读取块长度（块位置后的4个字节）
        chunkLen = byte.read(4).readUInt32BE(0);

        // 数据块类型（块长度后面的4个字节）
        chunkType = byte.read(4);

        // 得到块数据（块类型后面的数据，直到其块长度为止）
        chunkData = byte.read(chunkLen);

        // 得到块的CRC验证数据（块数据后的4个字节）
        chunkCRC = byte.read(4);

        // 下次处理的位置即从（当前的块数据的长度 + 长度定义4字节，类型定义4字节，CRC验证数据4字节。共12个字节之后）开始
        chunkPos += chunkLen + 12;

        switch (chunkType.toString('ascii')) {
            case 'IHDR':                                    // 解析头块，图像宽高分别在IHDR类型块中
                width = chunkData.readUInt32BE(0);
                height = chunkData.readUInt32BE(4);
            break;
            case 'IDAT':                                    // 解析信息块
                chunkIDAT.push(chunkData);                  // 存储块数据供之后解压
                skip = true;
            break;
            case 'CgBI':                                    // 删除CgBI块
                skip = true;
            break;
            case 'IEND':                                    // 添加所有累积的IDAT块
                try {
                    // 解压数据，deflateRaw方法不含zlib头
                    chunkData = zlib.inflateRawSync(Buffer.concat(chunkIDAT));
                } catch (error) {
                    // 已经标准化的不用理会
                    console.log(error);
                    return;
                };
                chunkType = Buffer.from('IDAT');

                // 将每个像素的红蓝色值交换，RGBA -> BGRA
                const tempArr = [];
                for(let y=0; y<height; y++){
                    let i = tempArr.length;
                    tempArr.push(chunkData[i]);

                    for(let x=0; x<width; x++){
                        let i = tempArr.length;
                        tempArr.push(chunkData[i + 2]);
                        tempArr.push(chunkData[i + 1]);
                        tempArr.push(chunkData[i + 0]);
                        tempArr.push(chunkData[i + 3]);
                    };
                };

                // 压缩图像块并更新块长度
                chunkData = zlib.deflateSync(Buffer.from(tempArr));
                chunkLen = chunkData.length;

                // CRC(cyclic redundancy check）域中的值是对Chunk Type Code域和Chunk Data域中的数据进行计算得到的
                // CRC具体算法定义在ISO 3309和ITU-T V.42中
                chunkCRC = (()=>{
                    let crc32Val = crc32(chunkType),
                        result = Buffer.allocUnsafe(4);
                    crc32Val = crc32(chunkData,crc32Val);
                    crc32Val = (chunkCRC + 0x100000000) % 0x100000000;

                    result.writeUInt32BE(crc32Val,0);
                    return result;
                })();

                breakLoop = true;
            break;
        };


        if(!skip){
            let lenBuf = Buffer.allocUnsafe(4);
            lenBuf.writeUInt32BE(chunkLen,0);
            resultArr.push(lenBuf);
            resultArr.push(chunkType);

            if(chunkLen){
                resultArr.push(chunkData);
            };
            resultArr.push(chunkCRC);
        };

        // 处理到末尾了块了，则可以跳出循环
        if(breakLoop){
            break;
        };
    };
    
    // 将各数据连接起来
    return Buffer.concat(resultArr);
};

// let newBuf = pngDecode('./src.png');
//     png2 = fs.readFileSync('./out.png');
// fs.writeFileSync('./out.png',newBuf);
// for(let i = 0,len=newBuf.length; i<len; i++){
//     if(newBuf[i] !== png2[i]){
//         console.log("不相等",i,'正常',png2[i],'错误',newBuf[i]);
//     };
// };


module.exports = pngDecode;