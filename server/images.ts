import sharp from 'sharp';
import * as json from "../dist/assets/images/images.json";
import { BufferedImage } from '../dogfight/src/BufferedImage';
const { canvas, loadImage } = require('canvas');

//const image = await loadImage("./dist/assets/images/images.png");
const gm = require('gm');

//const image = null;
//const image = gm("./dist/assets/images/images.png").crop(info.w, info.h, info.x, info.y).setFormat("raw").toBuffer(e => console.log(e));
//console.log(image);

export async function loadImages() {
  let images = {};
  const info = json.frames["runway.gif"].frame;
  await sharp("./dist/assets/images/images.png")
    .ensureAlpha()
    .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
    .extractChannel(3)
    .negate()
    .rotate(45)
    .negate()
    .png()
    .toFile("out.png");
  let dat;
  let inf;
  const img = await sharp("./dist/assets/images/images.png")
    .ensureAlpha()
    .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
    .extractChannel(3)
    .raw()
    .toBuffer((e, d, i) => {
      dat = d; inf = i; console.log(inf);

      console.log(info.w);
      console.log(info.h);
      for (let z = 0; z < 4; ++z) {
        for (let y = 0; y < 0 + info.h; y++) {
          let s = ""
          for (let x = 0; x < 0 + info.w; x++) {
            s += dat[4 * (x + y * info.w) + z] == 0 ? 0 : 1;
          }
          console.log(s);
        }
        console.log();
      }
    });
  for (let key in json.frames) {
    console.log(key);
    const info = json.frames[key].frame;
    //console.log(canvas.toBuffer("./dist/assets/images/images.png"))
    //console.log(await loadImage("./dist/assets/images/images.png"));
    images[key] = new BufferedImage(await sharp("./dist/assets/images/images.png")
      .ensureAlpha()
      .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
      .extractChannel(3)
      .negate()
      .raw()
      .toBuffer(), info);
    let ma = 256;
    if ([
      "bomb.gif",
      "bullet.gif",
      "plane4.gif",
      "plane5.gif",
      "plane6.gif",
      "plane7.gif",
      "plane8.gif",
      "plane9.gif",
    ].indexOf(key) >= 0) {
      for (let a = 0; a < ma + 1; ++a) {
        const ret2 = await sharp("./dist/assets/images/images.png")
          .ensureAlpha()
          .extractChannel(3)
          .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
          .negate()
          .rotate(-a / ma * 360)
          .raw()
          .toBuffer((e, d, i) => {
            images[key + "_rot" + a] = new BufferedImage(d, { w: i.width, h: i.height });
            //console.log(i.width + " x " + i.height);
          });
      }
    }
    //images[key] = new BufferedImage(await sharp("./dist/assets/images/images.png").extract({ left: info.x, top: info.y, width: info.w, height: info.h }).toFormat('raw').toBuffer(), info);
  }
  return images;
}