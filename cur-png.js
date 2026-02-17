export async function curToPng(file) {
    const buf = await file.arrayBuffer();
    const dv = new DataView(buf);

    // must be CUR
    const type = dv.getUint16(2, true);
    if (type !== 2) throw new Error("Not a CUR file");

    const imageSize = dv.getUint32(14, true);
    const imageOffset = dv.getUint32(18, true);

    const imageData = buf.slice(imageOffset, imageOffset + imageSize);

    // check PNG signature
    const sig = new Uint8Array(imageData.slice(0, 8));
    const pngSig = [137,80,78,71,13,10,26,10];

    let isPNG = true;
    for (let i=0; i<8; i++) {
        if (sig[i] !== pngSig[i]) { isPNG = false; break; }
    }

    if (isPNG) {
        return new Blob([imageData], { type: "image/png" });
    } else {
        return bmpBitsToPng(imageData);
    }
}

async function bmpBitsToPng(bmpBuf) {
    const dv = new DataView(bmpBuf);

    // bmp height is apparently doubled (height = actual height * 2)
    const w = dv.getUint32(18, true);
    const h2 = dv.getUint32(22, true);
    const h = h2 / 2;

    const bitsOff = dv.getUint32(10, true);
    const bmpBytes = new Uint8Array(bmpBuf);

    return new Promise((res, rej) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        const imgData = ctx.createImageData(w, h);

        const rowSize = Math.floor((32 * w + 31) / 32) * 4;
        const pixelArray = bmpBytes.slice(bitsOff);

        let dst = 0;

        for (let y = h - 1; y >= 0; y--) {
            let rowStart = y * rowSize;
            for (let x = 0; x < w; x++) {
                const pxOff = rowStart + x * 4;
                imgData.data[dst++] = pixelArray[pxOff + 2];
                imgData.data[dst++] = pixelArray[pxOff + 1];
                imgData.data[dst++] = pixelArray[pxOff + 0];
                imgData.data[dst++] = pixelArray[pxOff + 3];
            }
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob(blob => {
            if (!blob) return rej("Conversion failed");
            res(blob);
        }, "image/png");
    });
}

// png to cur stuff

export async function pngToCur(file, hotspotX=0, hotspotY=0) {
    const pngBuf = await file.arrayBuffer();

    const dvPNG = new DataView(pngBuf);
    const width = dvPNG.getUint32(16);
    const height = dvPNG.getUint32(20);

    const total = 6 + 16 + pngBuf.byteLength;
    const buf = new ArrayBuffer(total);
    const dv = new DataView(buf);

    let o = 0;
    dv.setUint16(o, 0, true); o+=2;
    dv.setUint16(o, 2, true); o+=2;
    dv.setUint16(o, 1, true); o+=2;

    dv.setUint8(o++, width>=256?0:width);
    dv.setUint8(o++, height>=256?0:height);
    dv.setUint8(o++, 0);
    dv.setUint8(o++, 0);

    dv.setUint16(o, hotspotX, true); o+=2;
    dv.setUint16(o, hotspotY, true); o+=2;

    dv.setUint32(o, pngBuf.byteLength, true); o+=4;
    dv.setUint32(o, 22, true); o+=4;

    new Uint8Array(buf,22).set(new Uint8Array(pngBuf));

    return new Blob([buf], { type: "image/x-icon" });
}

export function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
