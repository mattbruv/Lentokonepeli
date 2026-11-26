import * as PIXI from "pixi.js";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ 1234567890:!?/&Ü+-*%<>()ÁÉÑ'\"¿¡ÍÓÚØ";
const OFFSETS = [
    0, 23, 47, 71, 95, 116, 136, 160, 183, 195, 219, 243, 264, 299, 323, 347, 370, 394, 418, 442, 465, 489, 513, 542,
    566, 590, 614, 637, 661, 685, 700, 714, 736, 756, 777, 798, 819, 839, 859, 881, 901, 913, 924, 949, 972, 1002,
    1027, 1051, 1071, 1097, 1126, 1149, 1172, 1186, 1200, 1225, 1246, 1270, 1281, 1303, 1328, 1339, 1354, 1378, 1402,
];
const ATLAS_WIDTH = 1432;
const GLYPH_HEIGHT = 50;

const glyphs = new Map<string, PIXI.Texture>();

export async function loadBigTextFont() {
    const atlas = await PIXI.Assets.load<PIXI.Texture>("./images/bigtext.png");
    atlas.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    [...CHARSET].forEach((char, i) => {
        const x = OFFSETS[i];
        const width = (OFFSETS[i + 1] ?? ATLAS_WIDTH) - x;
        glyphs.set(char, new PIXI.Texture(atlas.baseTexture, new PIXI.Rectangle(x, 0, width, GLYPH_HEIGHT)));
    });
}

export class BigText {
    public container = new PIXI.Container();
    public width = 0;
    public height = 0;

    private text: string | null = null;

    constructor(
        private tint: number,
        private fallbackStyle: Partial<PIXI.ITextStyle>,
    ) {}

    public setText(text: string) {
        if (text === this.text) return;
        this.text = text;
        this.container.removeChildren().forEach((child) => child.destroy());

        const chars = [...text.toUpperCase()];
        if (chars.every((char) => glyphs.has(char))) {
            let x = 0;
            for (const char of chars) {
                const sprite = new PIXI.Sprite(glyphs.get(char));
                sprite.tint = this.tint;
                sprite.x = x;
                x += sprite.width;
                this.container.addChild(sprite);
            }
            this.width = x;
            this.height = chars.length > 0 ? GLYPH_HEIGHT : 0;
        } else {
            const fallback = new PIXI.Text(text, this.fallbackStyle);
            this.container.addChild(fallback);
            this.width = fallback.width;
            this.height = fallback.height;
        }
    }
}
