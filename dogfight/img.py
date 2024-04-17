from pathlib import Path
import glob

files = glob.glob("images/**")

sub = """
use image;

pub fn get_image(bytes: &[u8]) -> image::DynamicImage {
    image::load_from_memory(bytes).unwrap()
}

"""

# The purpose of this file is to generate rust code that includes the images
# as bytes at compile time. This is used for the image loader
# we never want to load them from disk directly because we are going to run this in WASM one day
# and the bytes will just be baked into the code
lines = []

for f in files:
    path = Path(f)
    name = path.name.split('.')[0].replace("-", "_")
    s = f"// pub const {name.upper()}: &[u8] = include_bytes!(\"../{path}\");\n"
    # s = f"// let {name.upper()} = image::load_from_memory({path}).unwrap();\n"
    lines.append([name, s])

lines = sorted(lines, key=lambda x: x[0])
ls = [x[1] for x in lines]
sub += ''.join(ls)

open("src/images.rs", "w").write(sub)