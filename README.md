# cur-png.js
Converts PNG to CUR and vice versa, as a JavaScript file.

This was specifically made for the repo [p2r3/convert](https://github/p2r3/convert) but you can use it any other way you'd like so long you credit me in some way.

Below is an example of how to use it:

```
import {curToPng, pngToCur, downloadBlob} from "./cur_png_converter.js" // <-- very important to work

// cur to png conversion
const png =
await curToPng(file)

downloadBlob(png, "cursor.png")

// png to cur conversion

const cur =
await pngToCur(file, 4, 4)

downloadBlob(cur, "cursor.cur")
```
