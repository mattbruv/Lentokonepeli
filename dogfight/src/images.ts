//import sharp from 'sharp';
import * as json from "../../dist/assets/images/images.json";
import { BufferedImage } from './BufferedImage';
//const { canvas, loadImage } = require('canvas');;
import jimp from 'jimp';

//const image = await loadImage("./dist/assets/images/images.png");
//const gm = require('gm');

//const image = null;
//const image = gm("./dist/assets/images/images.png").crop(info.w, info.h, info.x, info.y).setFormat("raw").toBuffer(e => console.log(e));
//console.log(image);

export async function loadImages(path = "./dist/assets/images/images.png") {
  let images = {};
  const info = json.frames["bomb.gif"].frame;

  const main_image = await jimp.read(path);
  /*
  image.crop(info.x, info.y, info.w, info.h)
    .rotate(45).autocrop()
    .write('out2.png');
    */

  const image1 = main_image.clone();
  image1.crop(info.x, info.y, info.w, info.h).rotate(45).autocrop();
  //.getBuffer(jimp.MIME_BMP, (e, dat) => 
  {
    let dat = image1.bitmap.data;
    console.log(dat);
    console.log(info.h * info.w + " vs " + dat.length);
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
  }


  /*
  await sharp("./dist/assets/images/images.png")
    .ensureAlpha()
    .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
    .extractChannel(3)
    .negate()
    .rotate(45)
    .negate()
    .png()
    .toFile("out.png");
    */
  let dat;
  let inf;
  /*
  const img = await sharp("./dist/assets/images/images.png")
    .ensureAlpha()
    .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
    .extractChannel(3)
    .raw()
    .toBuffer((e, d, i) => {
      dat = d; inf = i; console.log(inf);

      //console.log(info.w);
      //console.log(info.h);
      for (let z = 0; z < 4; ++z) {
        for (let y = 0; y < 0 + info.h; y++) {
          let s = ""
          for (let x = 0; x < 0 + info.w; x++) {
            s += dat[4 * (x + y * info.w) + z] == 0 ? 0 : 1;
          }
          //console.log(s);
        }
        //console.log();
      }
    });
    */
  for (let key in json.frames) {
    //console.log(key);
    const info = json.frames[key].frame;
    //console.log(canvas.toBuffer("./dist/assets/images/images.png"))
    //console.log(await loadImage("./dist/assets/images/images.png"));
    const image2 = main_image.clone(); //await jimp.read(path);
    image2.crop(info.x, info.y, info.w, info.h)
      //.autocrop()
      ;
    images[key] = new BufferedImage(Buffer.from(image2.bitmap.data), { w: image2.bitmap.width, h: image2.bitmap.height });
    /*
     images[key] = new BufferedImage(await sharp("./dist/assets/images/images.png")
       .ensureAlpha()
       .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
       .extractChannel(3)
       .negate()
       .raw()
       .toBuffer(), info);
       */
    let ma = 256;

    //image3 = image3.crop(info.x, info.y, info.w, info.h);
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
      let f: boolean = false;
      for (f of [true, false]) {
        for (let a = 0; a < ma + 1; ++a) {
          let image3 = image2.clone().flip(false, !f);//.clone();
          //console.log(a);
          image3
            .rotate(-a / ma * 360)
            .autocrop()
            ;
          let d = image3.bitmap.data;
          images[key + "_rot_" + a + "_flip_" + f] = new BufferedImage(Buffer.from(d), { w: image3.bitmap.width, h: image3.bitmap.height });
          if (a == 64 && key == "plane8.gif") image3.getBase64(jimp.MIME_PNG, (err, res) => {
            console.log(res)
          })
          /*
          const ret2 = await sharp("./dist/assets/images/images.png")
            .ensureAlpha()
            .extractChannel(3)
            .extract({ left: info.x, top: info.y, width: info.w, height: info.h })
            .negate()
            .rotate(-a / ma * 360)
            .raw()
            .toBuffer((e, d, i) => {
              //images[key + "_rot" + a] = new BufferedImage(d, { w: i.width, h: i.height });
              //console.log(i.width + " x " + i.height);
            });
            */
        }
      }

    }
    //images[key] = new BufferedImage(await sharp("./dist/assets/images/images.png").extract({ left: info.x, top: info.y, width: info.w, height: info.h }).toFormat('raw').toBuffer(), info);
  }
  return images;
}