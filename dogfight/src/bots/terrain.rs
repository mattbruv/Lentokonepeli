use crate::{collision::SolidEntity, world::World};

pub struct Terrain {
    segments: Vec<(f64, f64, f64)>,
    water: Vec<(f64, f64)>,
    pub min_x: f64,
    pub max_x: f64,
    pub ground_y: f64,
}

impl Terrain {
    pub fn from_world(world: &World) -> Self {
        let mut segments = vec![];
        let mut water = vec![];

        let mut push = |x: i16, y: i16, width: i16| {
            segments.push((x as f64, x as f64 + width as f64, y as f64));
        };

        for ground in world.grounds.get_map().values() {
            let b = ground.get_collision_bounds();
            push(b.x, b.y, b.width);
        }
        for coast in world.coasts.get_map().values() {
            let b = coast.get_collision_bounds();
            push(b.x, b.y, b.width);
        }
        for runway in world.runways.get_map().values() {
            let b = runway.get_collision_bounds();
            push(b.x, b.y, b.width);
        }
        for bunker in world.bunkers.get_map().values() {
            let b = bunker.get_collision_bounds();
            push(b.x, b.y, b.width);
        }
        for w in world.waters.get_map().values() {
            let b = w.get_collision_bounds();
            push(b.x, b.y, b.width);
            water.push((b.x as f64, b.x as f64 + b.width as f64));
        }

        let solid: Vec<(f64, f64)> = world
            .grounds
            .get_map()
            .values()
            .map(|g| g.get_collision_bounds())
            .chain(
                world
                    .runways
                    .get_map()
                    .values()
                    .map(|r| r.get_collision_bounds()),
            )
            .map(|b| (b.x as f64, b.x as f64 + b.width as f64))
            .collect();
        let min_x = solid.iter().map(|s| s.0).fold(f64::INFINITY, f64::min) - 300.0;
        let max_x = solid.iter().map(|s| s.1).fold(f64::NEG_INFINITY, f64::max) + 300.0;
        let ground_y = world
            .grounds
            .get_map()
            .values()
            .map(|g| g.get_collision_bounds().y as f64)
            .fold(f64::INFINITY, f64::min);

        Terrain {
            segments,
            water,
            min_x: if min_x.is_finite() { min_x } else { -2000.0 },
            max_x: if max_x.is_finite() { max_x } else { 2000.0 },
            ground_y: if ground_y.is_finite() { ground_y } else { 0.0 },
        }
    }

    pub fn surface(&self, x0: f64, x1: f64) -> f64 {
        let (low, high) = if x0 < x1 { (x0, x1) } else { (x1, x0) };
        self.segments
            .iter()
            .filter(|(a, b, _)| *b >= low && *a <= high)
            .map(|s| s.2)
            .fold(self.ground_y, f64::min)
    }

    pub fn is_water(&self, x: f64) -> bool {
        self.water.iter().any(|(a, b)| x >= *a && x <= *b)
    }
}
