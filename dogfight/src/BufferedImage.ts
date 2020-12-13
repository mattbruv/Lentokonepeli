
export class BufferedImage {
  public data;
  public info;
  public width: number;
  public height: number;

  public constructor(data, info) {
    this.data = data;
    this.info = info;
    //console.log(this.info);
    this.width = this.info.w;
    this.height = this.info.h;
  }

  public getWidth() {
    return this.info.w;
  }
  public getHeight() {
    return this.info.h;
  }
  public getDataLength() {
    return this.getWidth() * this.getHeight();
  }
}