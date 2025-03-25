// string -> collection of map objects
// get each collection of characters, grouped by type, ignore periods
// zip that with the index that it starts at

// some types should be repeatable, others not

use std::vec;
use ts_rs::TS;

use crate::{
    entities::{
        background_item::BackgroundItem,
        bunker::Bunker,
        coast::Coast,
        ground::Ground,
        hill::Hill,
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

macro_rules! map_pieces {
    ($($name:ident = $char:expr),* $(,)?) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq, TS)]
        #[ts(export)]
        pub enum MapPiece {
            $($name = $char as isize),*
        }

        impl MapPiece {
            pub fn from_char(c: char) -> Option<Self> {
                match c {
                    $($char => Some(MapPiece::$name)),*,
                    _ => None,
                }
            }
        }
    };
}

map_pieces!(
    Air = '.',
    GroundNormal = '#',
    GroundDesert = '_',
    WaterNormalLeft = '/',
    WaterNormalRight = '\\',
    WaterDesertLeft = '(',
    WaterDesertRight = ')',
    HillNormal = 'H',
    HillDesert = 'S',
    CoastNormalRight = '>',
    CoastNormalLeft = '<',
    CoastDesertLeft = '[',
    CoastDesertRight = ']',
    RunwayCentralsLeft = 'L',
    RunwayCentralsRight = 'R',
    RunwayAlliesLeft = 'l',
    RunwayAlliesRight = 'r',
    PalmTreeLeft = 'p',
    PalmTreeRight = 'P',
    ControlTowerLeft = 't',
    ControlTowerRight = 'T',
    DesertTowerLeft = 'd',
    DesertTowerRight = 'D',
    FlagAllies = 'f',
    FlagCentrals = 'F',
    BunkerCentrals = 'I',
    BunkerAllies = 'i',
);

impl World {
    pub fn load_level(&mut self, level_str: &str) {
        let level_data = parse_level(level_str);

        self.replay_file.level_name = level_data.name;
        self.replay_file.level_data = level_str.to_string();

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
                    let bunker = Bunker::new(team, pos.x as i16, pos.y as i16);
                    self.bunkers.insert(bunker);
                }
                LevelObject::Hill(pos, terrain) => {
                    let hill = Hill::new(terrain, pos.x as i16, pos.y as i16);
                    self.hills.insert(hill);
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

        if let Some(map_piece) = MapPiece::from_char(piece.character) {
            match map_piece {
                MapPiece::GroundNormal => objects.push(LevelObject::Ground(
                    Point { x: j, y: 0 },
                    i,
                    Terrain::Normal,
                )),
                MapPiece::GroundDesert => objects.push(LevelObject::Ground(
                    Point { x: j, y: 0 },
                    i,
                    Terrain::Desert,
                )),
                MapPiece::WaterNormalLeft => objects.push(LevelObject::Water(
                    Point { x: j, y: 25 },
                    i,
                    Terrain::Normal,
                    Facing::Left,
                )),
                MapPiece::WaterNormalRight => objects.push(LevelObject::Water(
                    Point { x: j, y: 25 },
                    i,
                    Terrain::Normal,
                    Facing::Right,
                )),
                MapPiece::WaterDesertLeft => objects.push(LevelObject::Water(
                    Point { x: j, y: 25 },
                    i,
                    Terrain::Desert,
                    Facing::Left,
                )),
                MapPiece::WaterDesertRight => objects.push(LevelObject::Water(
                    Point { x: j, y: 25 },
                    i,
                    Terrain::Desert,
                    Facing::Right,
                )),
                _ => println!("Unimplemented continued piece in map file: {:?}", map_piece),
            }
        }
    }

    for piece in uniques {
        let i = -(piece.length as i32) * 100 / 2;
        let j = piece.index as i32;

        if let Some(map_piece) = MapPiece::from_char(piece.character) {
            match map_piece {
                MapPiece::HillNormal => objects.push(LevelObject::Hill(
                    Point {
                        x: (i + j * 100 + 50) * 8 / 10,
                        y: -40,
                    },
                    Terrain::Normal,
                )),
                MapPiece::HillDesert => objects.push(LevelObject::Hill(
                    Point {
                        x: (i + j * 100 + 50) * 8 / 10,
                        y: -45, // yes, the Y value is different for sand hills
                    },
                    Terrain::Desert,
                )),
                MapPiece::CoastNormalRight => {
                    let k = j * 100;
                    objects.push(LevelObject::Coast(
                        Point { x: i + k, y: 0 },
                        Terrain::Normal,
                        Facing::Right,
                    ));
                }
                MapPiece::CoastNormalLeft => {
                    let img = get_image(BEACH_L);
                    let k = (j + 1) * 100 - img.width() as i32;
                    objects.push(LevelObject::Coast(
                        Point { x: i + k, y: 0 },
                        Terrain::Normal,
                        Facing::Left,
                    ));
                }
                MapPiece::CoastDesertLeft => {
                    let img = get_image(BEACH_L_DESERT);
                    let k = (j + 1) * 100 - img.width() as i32;
                    objects.push(LevelObject::Coast(
                        Point { x: i + k, y: 0 },
                        Terrain::Desert,
                        Facing::Left,
                    ));
                }
                MapPiece::CoastDesertRight => {
                    let k = j * 100;
                    objects.push(LevelObject::Coast(
                        Point { x: i + k, y: 0 },
                        Terrain::Desert,
                        Facing::Right,
                    ));
                }
                MapPiece::RunwayCentralsLeft => {
                    let img = get_image(RUNWAY2);
                    objects.push(LevelObject::Runway(
                        Point {
                            x: i + j * 100 + 50 - (img.width() / 2) as i32,
                            y: -25,
                        },
                        Team::Centrals,
                        Facing::Left,
                    ))
                }
                MapPiece::RunwayCentralsRight => {
                    let img = get_image(RUNWAY);
                    objects.push(LevelObject::Runway(
                        Point {
                            x: i + j * 100 + 50 - (img.width() / 2) as i32,
                            y: -25,
                        },
                        Team::Centrals,
                        Facing::Right,
                    ))
                }
                MapPiece::RunwayAlliesLeft => {
                    let img = get_image(RUNWAY2);
                    objects.push(LevelObject::Runway(
                        Point {
                            x: i + j * 100 + 50 - (img.width() / 2) as i32,
                            y: -25,
                        },
                        Team::Allies,
                        Facing::Left,
                    ))
                }
                MapPiece::RunwayAlliesRight => {
                    let img = get_image(RUNWAY);
                    objects.push(LevelObject::Runway(
                        Point {
                            x: i + j * 100 + 50 - (img.width() / 2) as i32,
                            y: -25,
                        },
                        Team::Allies,
                        Facing::Right,
                    ))
                }
                MapPiece::PalmTreeRight => objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50,
                        y: 5,
                    },
                    BackgroundItemType::PalmTree,
                    Facing::Right,
                )),
                MapPiece::PalmTreeLeft => objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50,
                        y: 5,
                    },
                    BackgroundItemType::PalmTree,
                    Facing::Left,
                )),
                MapPiece::ControlTowerLeft => objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50,
                        y: 5,
                    },
                    BackgroundItemType::ControlTower,
                    Facing::Left,
                )),
                MapPiece::ControlTowerRight => objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50,
                        y: 5,
                    },
                    BackgroundItemType::ControlTower,
                    Facing::Right,
                )),
                MapPiece::DesertTowerLeft => objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50,
                        y: 5,
                    },
                    BackgroundItemType::DesertTower,
                    Facing::Left,
                )),
                MapPiece::DesertTowerRight => objects.push(LevelObject::BackgroundItem(
                    Point {
                        x: i + j * 100 + 50,
                        y: 5,
                    },
                    BackgroundItemType::DesertTower,
                    Facing::Right,
                )),
                MapPiece::FlagAllies => {
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
                MapPiece::FlagCentrals => {
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
                MapPiece::BunkerCentrals => {
                    let img = get_image(HEADQUARTER_GERMANS);
                    objects.push(LevelObject::Bunker(
                        Point {
                            x: i + j * 100 + 50 - (img.width() as i32) / 2,
                            y: 0 - (img.height() as i32) + 7,
                        },
                        Team::Centrals,
                    ));
                }
                MapPiece::BunkerAllies => {
                    let img = get_image(HEADQUARTER_RAF);
                    objects.push(LevelObject::Bunker(
                        Point {
                            x: i + j * 100 + 50 - (img.width() as i32) / 2,
                            y: 0 - (img.height() as i32) + 7,
                        },
                        Team::Allies,
                    ));
                }
                _ => println!("Unimplemented unique piece in map file: {:?}", map_piece),
            }
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
    MapPiece::from_char(piece.character).map_or(false, |p| {
        matches!(
            p,
            MapPiece::GroundNormal
                | MapPiece::GroundDesert
                | MapPiece::WaterNormalLeft
                | MapPiece::WaterNormalRight
                | MapPiece::WaterDesertLeft
                | MapPiece::WaterDesertRight
        )
    })
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
