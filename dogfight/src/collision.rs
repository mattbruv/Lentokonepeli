use image::{codecs::jpeg::PixelDensity, RgbaImage};
use serde::Serialize;
use ts_rs::TS;

use crate::{
    entities::{
        entity::Entity,
        types::{EntityType, Team},
        EntityId,
    },
    math::Point,
};

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct DebugEntity {
    pub ent_id: EntityId,
    pub ent_type: EntityType,
    pub bounding_box: BoundingBox,
    pub pixels: Option<Vec<Point>>,
}

#[derive(Debug, Clone, Copy, Serialize, TS)]
#[ts(export)]
pub struct BoundingBox {
    pub x: i16,
    pub y: i16,
    pub width: i16,
    pub height: i16,
}

impl BoundingBox {
    /// Check if this bounding box intersects with another.
    pub fn intersects(&self, other: &BoundingBox) -> bool {
        let x_overlap = self.x < other.x + other.width && self.x + self.width > other.x;
        let y_overlap = self.y < other.y + other.height && self.y + self.height > other.y;
        x_overlap && y_overlap
    }

    /// Get the intersection area between two bounding boxes.
    pub fn intersection(&self, other: &BoundingBox) -> Option<BoundingBox> {
        if self.intersects(other) {
            let x = self.x.max(other.x);
            let y = self.y.max(other.y);
            let width = (self.x + self.width).min(other.x + other.width) - x;
            let height = (self.y + self.height).min(other.y + other.height) - y;
            Some(BoundingBox {
                x,
                y,
                width,
                height,
            })
        } else {
            None
        }
    }
}

pub trait SolidEntity: Entity {
    //fn is_alive(&self) -> bool;

    fn get_collision_bounds(&self) -> BoundingBox;
    fn get_collision_image(&self) -> Option<&RgbaImage>;

    fn check_collision(&self, other: &dyn SolidEntity) -> bool {
        let bounds_self = self.get_collision_bounds();
        let bounds_other = other.get_collision_bounds();

        if let Some(intersection) = bounds_self.intersection(&bounds_other) {
            let img_self = self.get_collision_image();
            let img_other = other.get_collision_image();

            // web_sys::console::log_1(&format!("{:?}", intersection).into());
            // web_sys::console::log_1(&format!("{:?}", img_self).into());
            // web_sys::console::log_1(&format!("{:?}", img_other).into());

            if img_self.is_none() && img_other.is_none() {
                return true;
            }

            if let Some(img) = img_self {
                if img_other.is_none() && check_pixels(img, &intersection, &bounds_self) {
                    // web_sys::console::log_1(&format!("img self: {:?}", intersection).into());
                    return true;
                }
            }

            if let Some(img) = img_other {
                if img_self.is_none() && check_pixels(img, &intersection, &bounds_other) {
                    //  web_sys::console::log_1(&format!("img other: {:?}", intersection).into());
                    return true;
                }
            }

            if let (Some(img_self), Some(img_other)) = (img_self, img_other) {
                // web_sys::console::log_1(&format!("double pixels: {:?}", intersection).into());
                return check_pixel_collision(
                    img_self,
                    &intersection,
                    &bounds_self,
                    img_other,
                    &bounds_other,
                );
            }
        }

        false
    }

    fn get_debug_pixels(&self) -> Option<Vec<Point>> {
        let mut pixels = vec![];
        let img = self.get_collision_image();

        if let Some(i) = img {
            for (x, y, pixel) in i.enumerate_pixels() {
                if pixel[3] != 0 {
                    pixels.push(Point {
                        x: x as i32,
                        y: y as i32,
                    });
                }
            }
        }

        match pixels.len() {
            0 => None,
            _ => Some(pixels),
        }
    }
}

/// Helper function to check if pixels in an image are non-transparent within a bounding box
fn check_pixels(image: &RgbaImage, intersection: &BoundingBox, bounds: &BoundingBox) -> bool {
    for y in 0..intersection.height {
        for x in 0..intersection.width {
            let pixel_x = intersection.x + x - bounds.x;
            let pixel_y = intersection.y + y - bounds.y;
            if image.get_pixel(pixel_x as u32, pixel_y as u32).0[3] != 0 {
                // web_sys::console::log_1(&format!("x: {} y: {}", pixel_x, pixel_y).into());
                return true;
            }
        }
    }
    false
}

/// Helper function to check for pixel-level collision between two images
fn check_pixel_collision(
    img1: &RgbaImage,
    intersection: &BoundingBox,
    bounds1: &BoundingBox,
    img2: &RgbaImage,
    bounds2: &BoundingBox,
) -> bool {
    for y in 0..intersection.height {
        for x in 0..intersection.width {
            let x1 = intersection.x + x - bounds1.x;
            let y1 = intersection.y + y - bounds1.y;
            let x2 = intersection.x + x - bounds2.x;
            let y2 = intersection.y + y - bounds2.y;

            let pixel1 = img1.get_pixel(x1 as u32, y1 as u32).0;
            let pixel2 = img2.get_pixel(x2 as u32, y2 as u32).0;

            if pixel1[3] != 0 && pixel2[3] != 0 {
                return true;
            }
        }
    }
    false
}
