use image::{self, GenericImage, Rgba, RgbaImage};
use imageproc::geometric_transformations::Interpolation;

pub fn get_rotateable_image(bytes: &[u8]) -> image::RgbaImage {
    let img = get_image(bytes);
    let (width, height) = img.dimensions();

    // Calculate the diagonal size
    let max_size = (f64::from(width.pow(2) + height.pow(2)).sqrt().ceil() as u32)
        .max(width)
        .max(height);

    let mut new_img = RgbaImage::new(max_size, max_size);
    for x in 0..max_size {
        for y in 0..max_size {
            new_img.put_pixel(x, y, Rgba([0, 0, 0, 0]));
        }
    }

    let x_offset = (max_size - width) / 2;
    let y_offset = (max_size - height) / 2;

    new_img.copy_from(&img, x_offset, y_offset).unwrap();

    new_img
}

pub fn rotate_image(img: &RgbaImage, angle: f64, flip_vertically: bool) -> RgbaImage {
    let mut new_image = img.clone();

    if flip_vertically {
        image::imageops::flip_vertical_in_place(&mut new_image);
    }

    imageproc::geometric_transformations::rotate_about_center(
        &new_image,
        angle as f32,
        Interpolation::Nearest,
        image::Rgba([0, 0, 0, 0]),
    )
}

pub fn get_image(bytes: &[u8]) -> image::RgbaImage {
    image::load_from_memory(bytes).unwrap().to_rgba8()
}

pub const BEACH_L: &[u8] = include_bytes!("../images/beach-l.gif");
pub const BEACH_L_DESERT: &[u8] = include_bytes!("../images/beach-l_desert.gif");
// pub const BEACH_R_DESERT: &[u8] = include_bytes!("../images/beach-r_desert.gif");
pub const BOMB: &[u8] = include_bytes!("../images/bomb.gif");
// pub const BULLET: &[u8] = include_bytes!("../images/bullet.gif");
// pub const CARRYBOMB: &[u8] = include_bytes!("../images/carrybomb.gif");
// pub const CONTROLTOWER: &[u8] = include_bytes!("../images/controlTower.gif");
// pub const CONTROLTOWERDESERT: &[u8] = include_bytes!("../images/controlTowerDesert.gif");
// pub const DROPPEDBOMB: &[u8] = include_bytes!("../images/droppedbomb.gif");
// pub const EXPLOSION0001: &[u8] = include_bytes!("../images/explosion0001.gif");
// pub const EXPLOSION0002: &[u8] = include_bytes!("../images/explosion0002.gif");
// pub const EXPLOSION0003: &[u8] = include_bytes!("../images/explosion0003.gif");
pub const EXPLOSION0004: &[u8] = include_bytes!("../images/explosion0004.gif");
// pub const EXPLOSION0005: &[u8] = include_bytes!("../images/explosion0005.gif");
// pub const EXPLOSION0006: &[u8] = include_bytes!("../images/explosion0006.gif");
// pub const EXPLOSION0007: &[u8] = include_bytes!("../images/explosion0007.gif");
// pub const EXPLOSION0008: &[u8] = include_bytes!("../images/explosion0008.gif");
pub const FLAG_GER_1: &[u8] = include_bytes!("../images/flag_ger_1.gif");
// pub const FLAG_GER_2: &[u8] = include_bytes!("../images/flag_ger_2.gif");
// pub const FLAG_GER_3: &[u8] = include_bytes!("../images/flag_ger_3.gif");
// pub const FLAG_RAF_1: &[u8] = include_bytes!("../images/flag_raf_1.gif");
// pub const FLAG_RAF_2: &[u8] = include_bytes!("../images/flag_raf_2.gif");
// pub const FLAG_RAF_3: &[u8] = include_bytes!("../images/flag_raf_3.gif");
// pub const GERMANFLAG: &[u8] = include_bytes!("../images/germanflag.jpg");
// pub const GERMANFLAG_SMALL: &[u8] = include_bytes!("../images/germanflag_small.gif");
pub const GROUND1: &[u8] = include_bytes!("../images/ground1.gif");
// pub const GROUNDDESERT: &[u8] = include_bytes!("../images/groundDesert.gif");
pub const HEADQUARTER_BROKE: &[u8] = include_bytes!("../images/headquarter_broke.gif");
pub const HEADQUARTER_GERMANS: &[u8] = include_bytes!("../images/headquarter_germans.gif");
pub const HEADQUARTER_RAF: &[u8] = include_bytes!("../images/headquarter_raf.gif");
// pub const HILL1: &[u8] = include_bytes!("../images/hill1.gif");
// pub const INFO_BOX: &[u8] = include_bytes!("../images/info_box.gif");
// pub const MAN_ICON: &[u8] = include_bytes!("../images/man_icon.gif");
// pub const MDL_PAGE: &[u8] = include_bytes!("../images/mdl_page.jpg");
// pub const METALPANEL: &[u8] = include_bytes!("../images/metalpanel.jpg");
// pub const PALMTREE: &[u8] = include_bytes!("../images/palmtree.gif");
pub const PARACHUTER0: &[u8] = include_bytes!("../images/parachuter0.gif");
pub const PARACHUTER1: &[u8] = include_bytes!("../images/parachuter1.gif");
pub const PARACHUTER2: &[u8] = include_bytes!("../images/parachuter2.gif");
pub const PARACHUTER3: &[u8] = include_bytes!("../images/parachuter3.gif");
// pub const PIC_PLANE4: &[u8] = include_bytes!("../images/pic_plane4.gif");
// pub const PIC_PLANE5: &[u8] = include_bytes!("../images/pic_plane5.gif");
// pub const PIC_PLANE6: &[u8] = include_bytes!("../images/pic_plane6.gif");
// pub const PIC_PLANE7: &[u8] = include_bytes!("../images/pic_plane7.gif");
// pub const PIC_PLANE8: &[u8] = include_bytes!("../images/pic_plane8.gif");
// pub const PIC_PLANE9: &[u8] = include_bytes!("../images/pic_plane9.gif");
pub const PLANE4: &[u8] = include_bytes!("../images/plane4.gif");
// pub const PLANE4_FLIP1: &[u8] = include_bytes!("../images/plane4_flip1.gif");
// pub const PLANE4_FLIP2: &[u8] = include_bytes!("../images/plane4_flip2.gif");
pub const PLANE5: &[u8] = include_bytes!("../images/plane5.gif");
// pub const PLANE5_FLIP1: &[u8] = include_bytes!("../images/plane5_flip1.gif");
// pub const PLANE5_FLIP2: &[u8] = include_bytes!("../images/plane5_flip2.gif");
pub const PLANE6: &[u8] = include_bytes!("../images/plane6.gif");
// pub const PLANE6_FLIP1: &[u8] = include_bytes!("../images/plane6_flip1.gif");
// pub const PLANE6_FLIP2: &[u8] = include_bytes!("../images/plane6_flip2.gif");
pub const PLANE7: &[u8] = include_bytes!("../images/plane7.gif");
// pub const PLANE7_FLIP1: &[u8] = include_bytes!("../images/plane7_flip1.gif");
// pub const PLANE7_FLIP2: &[u8] = include_bytes!("../images/plane7_flip2.gif");
pub const PLANE8: &[u8] = include_bytes!("../images/plane8.gif");
// pub const PLANE8_FLIP1: &[u8] = include_bytes!("../images/plane8_flip1.gif");
// pub const PLANE8_FLIP2: &[u8] = include_bytes!("../images/plane8_flip2.gif");
pub const PLANE9: &[u8] = include_bytes!("../images/plane9.gif");
// pub const PLANE9_FLIP1: &[u8] = include_bytes!("../images/plane9_flip1.gif");
// pub const PLANE9_FLIP2: &[u8] = include_bytes!("../images/plane9_flip2.gif");
// pub const PLANE_BIG: &[u8] = include_bytes!("../images/plane_big.gif");
// pub const PLANE_ICON: &[u8] = include_bytes!("../images/plane_icon.gif");
// pub const PLANE_SMALL: &[u8] = include_bytes!("../images/plane_small.gif");
// pub const RAF_FLAG_SMALL: &[u8] = include_bytes!("../images/raf_flag_small.gif");
// pub const RANDOMFLAG: &[u8] = include_bytes!("../images/randomflag.jpg");
// pub const RANDOMFLAG_SMALL: &[u8] = include_bytes!("../images/randomflag_small.gif");
// pub const ROYALAIRFORCESFLAG: &[u8] = include_bytes!("../images/royalairforcesflag.jpg");
pub const RUNWAY: &[u8] = include_bytes!("../images/runway.gif");
pub const RUNWAY2: &[u8] = include_bytes!("../images/runway2.gif");
// pub const RUNWAY2_BROKE: &[u8] = include_bytes!("../images/runway2_broke.gif");
// pub const RUNWAY2B: &[u8] = include_bytes!("../images/runway2b.gif");
// pub const RUNWAY_BROKE: &[u8] = include_bytes!("../images/runway_broke.gif");
// pub const SANDHILL: &[u8] = include_bytes!("../images/sandhill.gif");
// pub const SELECTIONSCREEN: &[u8] = include_bytes!("../images/selectionScreen.gif");
// pub const SKY3B: &[u8] = include_bytes!("../images/sky3b.jpg");
// pub const SMOKE1: &[u8] = include_bytes!("../images/smoke1.gif");
// pub const SMOKE2: &[u8] = include_bytes!("../images/smoke2.gif");
// pub const WAVE_L_1: &[u8] = include_bytes!("../images/wave-l_1.gif");
// pub const WAVE_L_2: &[u8] = include_bytes!("../images/wave-l_2.gif");
// pub const WAVE_L_3: &[u8] = include_bytes!("../images/wave-l_3.gif");
// pub const WAVE_L_4: &[u8] = include_bytes!("../images/wave-l_4.gif");
// pub const WAVE_L_5: &[u8] = include_bytes!("../images/wave-l_5.gif");
// pub const WAVE_L_6: &[u8] = include_bytes!("../images/wave-l_6.gif");
// pub const WAVE_L_7: &[u8] = include_bytes!("../images/wave-l_7.gif");
// pub const WOODPANEL: &[u8] = include_bytes!("../images/woodpanel.jpg");
