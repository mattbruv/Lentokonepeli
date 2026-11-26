use serde::Serialize;
use ts_rs::TS;

use crate::{
    collision::{BoundingBox, DebugEntityType, SolidEntity},
    entities::{
        container::PlayerId,
        man::ManState,
        plane::{PlaneMode, PlaneType},
        player::ControllingEntity,
        types::{Facing, Team},
    },
    world::World,
};

#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
pub struct InspectOwner {
    pub name: String,
    pub clan: Option<String>,
    pub team: Option<Team>,
    pub bot: bool,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct PlaneInspect {
    pub plane_type: PlaneType,
    pub mode: PlaneMode,
    pub health: i32,
    pub health_percent: u8,
    pub ammo: i32,
    pub ammo_percent: u8,
    pub fuel_percent: u8,
    pub bombs: u8,
    pub motor_on: bool,
    pub flipped: bool,
    pub speed: f64,
    pub direction: u8,
    pub abandoned: bool,
    pub downed_by: Option<InspectOwner>,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct ManInspect {
    pub state: ManState,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct BulletInspect {
    pub age: i32,
    pub damage_factor: f64,
    pub speed: u8,
    pub direction: u8,
    pub hit_enemy: bool,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct BombInspect {
    pub speed: f64,
    pub direction: u8,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct ExplosionInspect {
    pub phase: u8,
    pub age_ms: u32,
    pub damaging: bool,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct BuildingInspect {
    pub health: i32,
    pub max_health: i32,
    pub health_percent: u8,
    pub alive: bool,
    pub repairing: bool,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct RunwayInspect {
    pub building: BuildingInspect,
    pub facing: Facing,
    pub last_reservation: Option<String>,
    pub ms_since_reservation: i32,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum InspectDetails {
    Plane(PlaneInspect),
    Man(ManInspect),
    Bullet(BulletInspect),
    Bomb(BombInspect),
    Explosion(ExplosionInspect),
    Runway(RunwayInspect),
    Bunker(BuildingInspect),
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct InspectEntity {
    pub ent_type: DebugEntityType,
    pub team: Option<Team>,
    pub owner: Option<InspectOwner>,
    pub bounding_box: BoundingBox,
    pub details: InspectDetails,
}

fn contains(bounds: &BoundingBox, x: i16, y: i16, radius: i16) -> bool {
    let x = x as i32;
    let y = y as i32;
    let radius = radius as i32;
    let left = bounds.x as i32 - radius;
    let top = bounds.y as i32 - radius;
    let right = bounds.x as i32 + bounds.width as i32 + radius;
    let bottom = bounds.y as i32 + bounds.height as i32 + radius;
    x >= left && x < right && y >= top && y < bottom
}

impl World {
    fn inspect_owner(&self, player_id: PlayerId) -> Option<InspectOwner> {
        self.players.get(player_id).map(|player| InspectOwner {
            name: player.get_name(),
            clan: player.get_clan(),
            team: *player.get_team(),
            bot: player.is_bot(),
        })
    }

    fn controller_of(&self, entity: ControllingEntity) -> Option<PlayerId> {
        self.players
            .get_map()
            .iter()
            .find(|(_, player)| player.get_controlling() == Some(entity))
            .map(|(id, _)| *id)
    }

    pub fn inspect(&self, x: i16, y: i16, radius: i16) -> Vec<InspectEntity> {
        let mut found = vec![];

        for (id, bullet) in self.bullets.get_map() {
            let bounds = bullet.get_collision_bounds();
            if contains(&bounds, x, y, radius) {
                let owner = self.inspect_owner(bullet.player_id());
                found.push(InspectEntity {
                    ent_type: DebugEntityType::Bullet(*id),
                    team: owner.as_ref().and_then(|o| o.team),
                    owner,
                    bounding_box: bounds,
                    details: InspectDetails::Bullet(bullet.inspect()),
                });
            }
        }

        for (id, bomb) in self.bombs.get_map() {
            let bounds = bomb.get_collision_bounds();
            if contains(&bounds, x, y, radius) {
                let owner = self.inspect_owner(bomb.player_id());
                found.push(InspectEntity {
                    ent_type: DebugEntityType::Bomb(*id),
                    team: owner.as_ref().and_then(|o| o.team),
                    owner,
                    bounding_box: bounds,
                    details: InspectDetails::Bomb(bomb.inspect()),
                });
            }
        }

        for (id, man) in self.men.get_map() {
            let bounds = man.get_collision_bounds();
            if contains(&bounds, x, y, radius) {
                found.push(InspectEntity {
                    ent_type: DebugEntityType::Man(*id),
                    team: Some(man.get_team()),
                    owner: self
                        .controller_of(ControllingEntity::Man(*id))
                        .and_then(|player_id| self.inspect_owner(player_id)),
                    bounding_box: bounds,
                    details: InspectDetails::Man(ManInspect {
                        state: man.get_state(),
                    }),
                });
            }
        }

        for (id, plane) in self.planes.get_map() {
            let bounds = plane.get_collision_bounds();
            if contains(&bounds, x, y, radius) {
                let abandoned = self.controller_of(ControllingEntity::Plane(*id)).is_none();
                let downed_by = plane
                    .get_downed_by()
                    .and_then(|player_id| self.inspect_owner(player_id));
                let details = plane.inspect(abandoned, downed_by);
                found.push(InspectEntity {
                    ent_type: DebugEntityType::Plane(*id),
                    team: Some(plane.get_team()),
                    owner: self.inspect_owner(plane.player_id()),
                    bounding_box: bounds,
                    details: InspectDetails::Plane(details),
                });
            }
        }

        for (id, explosion) in self.explosions.get_map() {
            let bounds = explosion.get_collision_bounds();
            if contains(&bounds, x, y, radius) {
                found.push(InspectEntity {
                    ent_type: DebugEntityType::Explosion(*id),
                    team: *explosion.get_team(),
                    owner: explosion
                        .player_id()
                        .and_then(|player_id| self.inspect_owner(player_id)),
                    bounding_box: bounds,
                    details: InspectDetails::Explosion(explosion.inspect()),
                });
            }
        }

        for (id, bunker) in self.bunkers.get_map() {
            let bounds = bunker.get_collision_bounds();
            if contains(&bounds, x, y, radius) {
                found.push(InspectEntity {
                    ent_type: DebugEntityType::Bunker(*id),
                    team: Some(*bunker.get_team()),
                    owner: None,
                    bounding_box: bounds,
                    details: InspectDetails::Bunker(bunker.inspect()),
                });
            }
        }

        for (id, runway) in self.runways.get_map() {
            let bounds = runway.get_collision_bounds();
            if contains(&bounds, x, y, radius) {
                found.push(InspectEntity {
                    ent_type: DebugEntityType::Runway(*id),
                    team: Some(*runway.get_team()),
                    owner: None,
                    bounding_box: bounds,
                    details: InspectDetails::Runway(runway.inspect()),
                });
            }
        }

        found
    }

    pub fn inspect_json(&self, x: i16, y: i16, radius: i16) -> String {
        serde_json::to_string(&self.inspect(x, y, radius)).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::InspectDetails;
    use crate::{
        collision::DebugEntityType,
        entities::{bullet::Bullet, container::PlayerId},
        network::encoding::NetworkedBytes,
        world::World,
    };

    #[test]
    fn inspect_finds_bullet_near_point_only() {
        let mut world = World::new();
        let (_, owner) = PlayerId::from_bytes(&[0, 0]).unwrap();
        world.bullets.insert(Bullet::new(
            owner,
            crate::entities::bullet::BulletOrigin::Man(crate::entities::container::ManId::from(0)),
            100,
            100,
            0.0,
            4.0,
        ));

        let hits = world.inspect(101, 101, 0);
        assert_eq!(hits.len(), 1);
        assert!(matches!(hits[0].ent_type, DebugEntityType::Bullet(_)));
        assert!(matches!(hits[0].details, InspectDetails::Bullet(_)));
        assert!(hits[0].owner.is_none());

        assert!(world.inspect(110, 110, 0).is_empty());
        assert_eq!(world.inspect(104, 104, 3).len(), 1);
    }
}
