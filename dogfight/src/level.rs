// string -> collection of map objects
// get each collection of characters, grouped by type, ignore periods
// zip that with the index that it starts at

// some types should be repeatable, others not

use std::vec;

use crate::{
    entities::{
        background_item::BackgroundItem,
        coast::Coast,
        ground::Ground,
        runway::Runway,
        types::{BackgroundItemType, Facing, Team, Terrain},
        water::Water,
    },
    images::{
        get_image, BEACH_L, BEACH_L_DESERT, FLAG_GER_1, HEADQUARTER_GERMANS, HEADQUARTER_RAF,
        RUNWAY, RUNWAY2,
    },
    math::Point,
    world::World,
};

impl World {
    pub fn load_level(&mut self, level_str: &str) {
        let level_data = parse_level(level_str);

        for object in level_data.objects {
            match object {
                LevelObject::Ground(pos, width, terrain) => {
                    let ground = Ground::new(terrain, width as i16, pos.x as i16, pos.y as i16);
                    self.grounds.insert(ground);
                }
                LevelObject::Water(pos, width, terrain, facing) => {
                    let water =
                        Water::new(terrain, facing, width as i16, pos.x as i16, pos.y as i16);
                    self.waters.insert(water);
                }
                LevelObject::Coast(pos, terrain, facing) => {
                    let coast = Coast::new(terrain, facing, pos.x as i16, pos.y as i16);
                    self.coasts.insert(coast);
                }
                LevelObject::Runway(pos, team, facing) => {
                    let runway = Runway::new(team, facing, pos.x as i16, pos.y as i16);
                    self.runways.insert(runway);
                }
                LevelObject::BackgroundItem(pos, item_type, facing) => {
                    let bg_item =
                        BackgroundItem::new(item_type, facing, pos.x as i16, pos.y as i16);
                    self.background_items.insert(bg_item);
                }
                LevelObject::Bunker(pos, team) => {
                    //println!("bunker {:?} {:?}", pos, team);
                }
                LevelObject::Hill(pos, terrain) => {
                    //println!("{:?}", pos);
                }
            }
        }
    }
}

#[derive(Debug)]
struct CharInfo {
    character: char,
    repeat: usize,
    index: usize,
    end: bool,
    length: usize,
}

#[derive(Debug)]
pub struct Level {
    pub name: String,
    pub designer: String,
    pub time_winner: Option<Team>,
    pub objects: Vec<LevelObject>,
}

#[derive(Debug)]
pub enum LevelObject {
    Ground(Point, i32, Terrain),
    Water(Point, i32, Terrain, Facing),
    Hill(Point, Terrain),
    Coast(Point, Terrain, Facing),
    Runway(Point, Team, Facing),
    Bunker(Point, Team),
    BackgroundItem(Point, BackgroundItemType, Facing),
}

fn parse_level(level_str: &str) -> Level {
    // println!("parse level: {}", level_str);
    let mut level = Level {
        name: String::from("unnamed"),
        designer: String::from("anonymous"),
        time_winner: None,
        objects: vec![],
    };

    for line in level_str.lines() {
        if line.contains("=") {
            if let Some((key, value)) = line.split_once("=") {
                if key.to_lowercase().contains("layer") {
                    let mut objects = parse_layer(value);
                    level.objects.append(&mut objects);
                } else {
                    match key.to_lowercase().as_str() {
                        "designer" => level.designer = value.to_string(),
                        "time_winner" => {
                            level.time_winner = match value.to_lowercase().as_str() {
                                "allies" => Some(Team::Allies),
                                "centrals" => Some(Team::Centrals),
                                _ => None,
                            }
                        }
                        _ => {}
                    }
                }
                // println!("key: {}, value: {}", key, value);
            }
        } else {
            level.name = line.to_string();
        }
    }

    level
}

fn parse_layer(layer: &str) -> Vec<LevelObject> {
    let chars = run_length_encode(layer);

    let continued: Vec<&CharInfo> = chars.iter().filter(|x| is_continued_piece(x)).collect();
    let uniques: Vec<CharInfo> = chars
        .iter()
        .filter(|x| !is_continued_piece(x))
        .flat_map(|x| get_unique_pieces(x))
        .collect();

    let mut objects = vec![];

    for piece in continued {
        let index = piece.index as i32; // index of piece
        let start_x = -(piece.length as i32) * 100 / 2; // starting X

        let mut i = 100; // width of the piece
        let j; // starting X position offset?

        if index == 0 {
            j = -22000;
            i += 22000 + start_x;
        } else {
            j = index * 100 + start_x
        }

        // add width to i
        i += (piece.repeat as i32 - 1) * 100;

        // if this is an end piece
        if piece.end {
            i = 22000;
        }

        // return {j, i, index}
        // ground = (1=x, 2=y, 3=width)

        match piece.character {
            '#' => objects.push(LevelObject::Ground(
                Point { x: j, y: 0 },
                i,
                Terrain::Normal,
            )),
            '_' => objects.push(LevelObject::Ground(
                Point { x: j, y: 0 },
                i,
                Terrain::Desert,
            )),
            '/' => objects.push(LevelObject::Water(
                Point { x: j, y: 25 },
                i,
                Terrain::Normal,
                Facing::Left,
            )),
            '\\' => objects.push(LevelObject::Water(
                Point { x: j, y: 25 },
                i,
                Terrain::Normal,
                Facing::Right,
            )),
            '(' => objects.push(LevelObject::Water(
                Point { x: j, y: 25 },
                i,
                Terrain::Desert,
                Facing::Left,
            )),
            ')' => objects.push(LevelObject::Water(
                Point { x: j, y: 25 },
                i,
                Terrain::Desert,
                Facing::Right,
            )),
            _ => println!(
                "Unimpleneted continued piece in map file: {}",
                piece.character
            ),
        }
    }

    for piece in uniques {
        let i = -(piece.length as i32) * 100 / 2;
        let j = piece.index as i32;
        match piece.character {
            'H' => objects.push(LevelObject::Hill(
                Point {
                    x: (i + j * 100 + 50) * 8 / 10,
                    y: -40,
                },
                Terrain::Normal,
            )),
            'S' => objects.push(LevelObject::Hill(
                Point {
                    x: (i + j * 100 + 50) * 8 / 10,
                    y: -45, // yes, the Y value is different for sand hills
                },
                Terrain::Desert,
            )),
            // coast(x, y, type)
            '>' => {
                let k = j * 100;
                objects.push(LevelObject::Coast(
                    Point { x: i + k, y: 0 },
                    Terrain::Normal,
                    Facing::Right,
                ));
            }
            '<' => {
                let img = get_image(BEACH_L);
                let k = (j + 1) * 100 - img.width() as i32;
                objects.push(LevelObject::Coast(
                    Point { x: i + k, y: 0 },
                    Terrain::Normal,
                    Facing::Left,
                ));
            }
            '[' => {
                let img = get_image(BEACH_L_DESERT);
                let k = (j + 1) * 100 - img.width() as i32;
                objects.push(LevelObject::Coast(
                    Point { x: i + k, y: 0 },
                    Terrain::Desert,
                    Facing::Left,
                ));
            }
            ']' => {
                let k = j * 100;
                objects.push(LevelObject::Coast(
                    Point { x: i + k, y: 0 },
                    Terrain::Desert,
                    Facing::Right,
                ));
            }
            'L' => {
                let img = get_image(RUNWAY2);
                objects.push(LevelObject::Runway(
                    Point {
                        x: i + j * 100 + 50 - (img.width() / 2) as i32, //
                        y: -25,
                    },
                    Team::Allies,
                    Facing::Left,
                ))
            }
            'R' => {
                let img = get_image(RUNWAY);
                objects.push(LevelObject::Runway(
                    Point {
                        x: i + j * 100 + 50 - (img.width() / 2) as i32, //
                        y: -25,
                    },
                    Team::Allies,
                    Facing::Right,
                ))
            }
            'l' => {
                let img = get_image(RUNWAY2);
                objects.push(LevelObject::Runway(
                    Point {
                        x: i + j * 100 + 50 - (img.width() / 2) as i32, //
                        y: -25,
                    },
                    Team::Centrals,
                    Facing::Left,
                ))
            }
            'r' => {
                let img = get_image(RUNWAY);
                objects.push(LevelObject::Runway(
                    Point {
                        x: i + j * 100 + 50 - (img.width() / 2) as i32, //
                        y: -25,
                    },
                    Team::Centrals,
                    Facing::Right,
                ))
            }
            'P' => objects.push(LevelObject::BackgroundItem(
                Point {
                    x: i + j * 100 + 50,
                    y: 5,
                },
                BackgroundItemType::PalmTree,
                Facing::Right,
            )),
            'p' => objects.push(LevelObject::BackgroundItem(
                Point {
                    x: i + j * 100 + 50,
                    y: 5,
                },
                BackgroundItemType::PalmTree,
                Facing::Left,
            )),
            't' => objects.push(LevelObject::BackgroundItem(
                Point {
                    x: i + j * 100 + 50,
                    y: 5,
                },
                BackgroundItemType::ControlTower,
                Facing::Left,
            )),
            'T' => objects.push(LevelObject::BackgroundItem(
                Point {
                    x: i + j * 100 + 50,
                    y: 5,
                },
                BackgroundItemType::ControlTower,
                Facing::Right,
            )),
            'd' => objects.push(LevelObject::BackgroundItem(
                Point {
                    x: i + j * 100 + 50,
                    y: 5,
                },
                BackgroundItemType::DesertTower,
                Facing::Left,
            )),
            'D' => objects.push(LevelObject::BackgroundItem(
                Point {
                    x: i + j * 100 + 50,
                    y: 5,
                },
                BackgroundItemType::DesertTower,
                Facing::Right,
            )),
            'f' => {
                let flag = get_image(FLAG_GER_1);
                objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50 - (flag.width() as i32) / 2,
                        y: -90,
                    },
                    BackgroundItemType::FlagAllies,
                    Facing::Right,
                ));
            }
            'F' => {
                let flag = get_image(FLAG_GER_1);
                objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50 - (flag.width() as i32) / 2,
                        y: -90,
                    },
                    BackgroundItemType::FlagCentrals,
                    Facing::Right,
                ));
            }
            'I' => {
                let img = get_image(HEADQUARTER_GERMANS);
                objects.push(LevelObject::Bunker(
                    Point {
                        x: i + j * 100 + 50 - (img.width() as i32) / 2,
                        y: 0 - (img.height() as i32) + 7,
                    },
                    Team::Centrals,
                ));
            }
            'i' => {
                let img = get_image(HEADQUARTER_RAF);
                objects.push(LevelObject::Bunker(
                    Point {
                        x: i + j * 100 + 50 - (img.width() as i32) / 2,
                        y: 0 - (img.height() as i32) + 7,
                    },
                    Team::Allies,
                ));
            }
            _ => println!("Unimpleneted unique piece in map file: {}", piece.character),
        }
    }

    objects
}

fn get_unique_pieces(piece: &CharInfo) -> Vec<CharInfo> {
    let max = piece.repeat;
    let mut pieces = vec![];
    for p in 0..max {
        pieces.push(CharInfo {
            character: piece.character,
            repeat: 1,
            index: piece.index + p,
            end: piece.end,
            length: piece.length,
        })
    }
    pieces
}

fn is_continued_piece(piece: &CharInfo) -> bool {
    match piece.character {
        '#' | '_' | '/' | '\\' | '(' | ')' => true,
        _ => false,
    }
}

// charInfo, (charinfo => T) => Vec<T>
// fn parse_unique(info: CharInfo) -> LevelObject

fn run_length_encode(s: &str) -> Vec<CharInfo> {
    let mut result: Vec<CharInfo> = Vec::new();
    let mut current_char = None;
    let mut current_count = 0;
    let mut current_index = 0;

    for c in s.chars() {
        if let Some(last_char) = current_char {
            if c == last_char {
                current_count += 1;
            } else {
                result.push(CharInfo {
                    character: last_char,
                    repeat: current_count,
                    index: current_index - current_count,
                    end: false,
                    length: s.len(),
                });
                current_char = Some(c);
                current_count = 1;
            }
        } else {
            current_char = Some(c);
            current_count = 1;
        }

        current_index += 1;
    }

    if let Some(last_char) = current_char {
        result.push(CharInfo {
            character: last_char,
            repeat: current_count,
            index: current_index - current_count,
            end: true,
            length: s.len(),
        });
    }

    // period (.) represents an empty block, discard all of these
    result.into_iter().filter(|x| x.character != '.').collect()
}
