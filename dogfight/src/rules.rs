use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::entities::{plane::PlaneType, types::Team};

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, TS)]
#[serde(default)]
#[ts(export)]
pub struct PlaneRules {
    pub allowed: bool,
    pub health: u16,
    pub ammo: u16,
    pub fuel: u16,
    pub bombs: u8,
    pub shoot_delay_ms: u16,
    pub bomb_delay_ms: u16,
    pub acceleration_percent: u16,
    pub turn_percent: u16,
    pub speed_bonus: u16,
}

impl PlaneRules {
    pub fn original(plane_type: PlaneType) -> Self {
        let (health, ammo, fuel, bombs, shoot_delay_ms, speed_bonus) = match plane_type {
            PlaneType::Albatros => (135, 95, 80, 0, 118, 55),
            PlaneType::Junkers => (160, 100, 100, 5, 170, 0),
            PlaneType::Fokker => (120, 90, 90, 0, 120, 0),
            PlaneType::Bristol => (135, 100, 60, 0, 97, 0),
            PlaneType::Salmson => (90, 60, 60, 5, 180, 50),
            PlaneType::Sopwith => (120, 80, 80, 0, 130, 50),
        };
        PlaneRules {
            allowed: true,
            health,
            ammo,
            fuel,
            bombs,
            shoot_delay_ms,
            bomb_delay_ms: 500,
            acceleration_percent: 100,
            turn_percent: 100,
            speed_bonus,
        }
    }

    fn sanitized(self) -> Self {
        PlaneRules {
            allowed: self.allowed,
            health: self.health.clamp(1, 10_000),
            ammo: self.ammo.clamp(1, 999),
            fuel: self.fuel.clamp(1, 999),
            bombs: self.bombs.min(50),
            shoot_delay_ms: self.shoot_delay_ms.clamp(10, 2_000),
            bomb_delay_ms: self.bomb_delay_ms.clamp(50, 5_000),
            acceleration_percent: self.acceleration_percent.clamp(25, 300),
            turn_percent: self.turn_percent.clamp(25, 300),
            speed_bonus: self.speed_bonus.min(200),
        }
    }
}

impl Default for PlaneRules {
    fn default() -> Self {
        PlaneRules::original(PlaneType::Fokker)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, TS)]
#[serde(default)]
#[ts(export)]
pub struct PlaneRulesByType {
    pub albatros: PlaneRules,
    pub junkers: PlaneRules,
    pub fokker: PlaneRules,
    pub bristol: PlaneRules,
    pub salmson: PlaneRules,
    pub sopwith: PlaneRules,
}

impl Default for PlaneRulesByType {
    fn default() -> Self {
        PlaneRulesByType {
            albatros: PlaneRules::original(PlaneType::Albatros),
            junkers: PlaneRules::original(PlaneType::Junkers),
            fokker: PlaneRules::original(PlaneType::Fokker),
            bristol: PlaneRules::original(PlaneType::Bristol),
            salmson: PlaneRules::original(PlaneType::Salmson),
            sopwith: PlaneRules::original(PlaneType::Sopwith),
        }
    }
}

impl PlaneRulesByType {
    pub fn get(&self, plane_type: PlaneType) -> &PlaneRules {
        match plane_type {
            PlaneType::Albatros => &self.albatros,
            PlaneType::Junkers => &self.junkers,
            PlaneType::Fokker => &self.fokker,
            PlaneType::Bristol => &self.bristol,
            PlaneType::Salmson => &self.salmson,
            PlaneType::Sopwith => &self.sopwith,
        }
    }

    fn get_mut(&mut self, plane_type: PlaneType) -> &mut PlaneRules {
        match plane_type {
            PlaneType::Albatros => &mut self.albatros,
            PlaneType::Junkers => &mut self.junkers,
            PlaneType::Fokker => &mut self.fokker,
            PlaneType::Bristol => &mut self.bristol,
            PlaneType::Salmson => &mut self.salmson,
            PlaneType::Sopwith => &mut self.sopwith,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, TS)]
#[serde(default)]
#[ts(export)]
pub struct GameRules {
    pub plane_guns: bool,
    pub bombs: bool,
    pub pilot_guns: bool,
    pub bail_out: bool,
    pub friendly_fire: bool,
    pub plane_collisions: bool,
    pub unlimited_ammo: bool,
    pub unlimited_fuel: bool,
    pub unlimited_bombs: bool,
    pub damage_percent: u16,
    pub runway_health: u16,
    pub headquarters_health: u16,
    pub repair_ticks: u16,
    pub indestructible_buildings: bool,
    pub runway_delay_percent: u16,
    pub respawn_ticks: u16,
    pub suicide_respawn_ticks: u16,
    pub team_kill_respawn_ticks: u16,
    pub pilot_invulnerability_ms: u16,
    pub pilot_shoot_delay_ms: u16,
    pub planes: PlaneRulesByType,
}

impl Default for GameRules {
    fn default() -> Self {
        GameRules {
            plane_guns: true,
            bombs: true,
            pilot_guns: true,
            bail_out: true,
            friendly_fire: true,
            plane_collisions: true,
            unlimited_ammo: false,
            unlimited_fuel: false,
            unlimited_bombs: false,
            damage_percent: 100,
            runway_health: 1530,
            headquarters_health: 350,
            repair_ticks: 50,
            indestructible_buildings: false,
            runway_delay_percent: 100,
            respawn_ticks: 400,
            suicide_respawn_ticks: 800,
            team_kill_respawn_ticks: 1000,
            pilot_invulnerability_ms: 200,
            pilot_shoot_delay_ms: 500,
            planes: PlaneRulesByType::default(),
        }
    }
}

const TEAM_PLANES: [(Team, [PlaneType; 3]); 2] = [
    (
        Team::Centrals,
        [PlaneType::Albatros, PlaneType::Junkers, PlaneType::Fokker],
    ),
    (
        Team::Allies,
        [PlaneType::Bristol, PlaneType::Salmson, PlaneType::Sopwith],
    ),
];

impl GameRules {
    pub fn sanitized(self) -> Self {
        let mut rules = GameRules {
            damage_percent: self.damage_percent.min(1_000),
            runway_health: self.runway_health.clamp(1, 20_000),
            headquarters_health: self.headquarters_health.clamp(1, 20_000),
            repair_ticks: self.repair_ticks.min(1_000),
            runway_delay_percent: self.runway_delay_percent.min(500),
            respawn_ticks: self.respawn_ticks.min(6_000),
            suicide_respawn_ticks: self.suicide_respawn_ticks.min(6_000),
            team_kill_respawn_ticks: self.team_kill_respawn_ticks.min(6_000),
            pilot_invulnerability_ms: self.pilot_invulnerability_ms.min(2_000),
            pilot_shoot_delay_ms: self.pilot_shoot_delay_ms.clamp(100, 5_000),
            ..self
        };
        for (_, types) in TEAM_PLANES {
            for plane_type in types {
                let plane = rules.planes.get_mut(plane_type);
                *plane = plane.sanitized();
            }
            if !types.iter().any(|t| rules.planes.get(*t).allowed) {
                for plane_type in types {
                    rules.planes.get_mut(plane_type).allowed = true;
                }
            }
        }
        rules
    }

    pub fn plane(&self, plane_type: PlaneType) -> &PlaneRules {
        self.planes.get(plane_type)
    }

    pub fn plane_allowed(&self, plane_type: PlaneType) -> bool {
        self.planes.get(plane_type).allowed
    }

    pub fn allowed_plane_index(&self, team: Team, preferred: u8, step: u8) -> u8 {
        let types = TEAM_PLANES
            .iter()
            .find(|(t, _)| *t == team)
            .map(|(_, types)| types)
            .unwrap_or(&TEAM_PLANES[0].1);
        let step = step.max(1) % 3;
        let mut index = preferred % 3;
        for _ in 0..3 {
            if self.plane_allowed(types[index as usize]) {
                return index;
            }
            index = (index + if step == 0 { 1 } else { step }) % 3;
        }
        preferred % 3
    }

    pub fn scale_damage(&self, amount: i32) -> i32 {
        scale_damage(amount, self.damage_percent)
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    pub fn from_json(json: &str) -> Option<Self> {
        serde_json::from_str::<GameRules>(json)
            .ok()
            .map(GameRules::sanitized)
    }
}

pub fn scale_damage(amount: i32, percent: u16) -> i32 {
    if percent == 100 {
        amount
    } else {
        amount * percent as i32 / 100
    }
}

pub fn scale_percent(value: f64, percent: u16) -> f64 {
    if percent == 100 {
        value
    } else {
        value * percent as f64 / 100.0
    }
}

pub fn default_rules_json() -> String {
    GameRules::default().to_json()
}

pub fn sanitize_rules_json(json: &str) -> String {
    GameRules::from_json(json).unwrap_or_default().to_json()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_survive_sanitizing() {
        assert_eq!(GameRules::default().sanitized(), GameRules::default());
    }

    #[test]
    fn missing_fields_fall_back_to_defaults() {
        let rules =
            GameRules::from_json(r#"{"bombs":false,"planes":{"fokker":{"ammo":5}}}"#).unwrap();
        assert!(!rules.bombs);
        assert!(rules.plane_guns);
        assert_eq!(rules.planes.fokker.ammo, 5);
        assert_eq!(rules.planes.fokker.health, 120);
        assert_eq!(rules.planes.junkers.bombs, 5);
    }

    #[test]
    fn every_team_keeps_an_allowed_plane() {
        let mut rules = GameRules::default();
        rules.planes.bristol.allowed = false;
        rules.planes.salmson.allowed = false;
        rules.planes.sopwith.allowed = false;
        let rules = rules.sanitized();
        assert!(rules.planes.bristol.allowed && rules.planes.sopwith.allowed);
    }

    #[test]
    fn allowed_plane_index_skips_forbidden_planes() {
        let mut rules = GameRules::default();
        rules.planes.junkers.allowed = false;
        assert_eq!(rules.allowed_plane_index(Team::Centrals, 1, 1), 2);
        assert_eq!(rules.allowed_plane_index(Team::Centrals, 1, 2), 0);
        assert_eq!(rules.allowed_plane_index(Team::Centrals, 0, 1), 0);
    }
}
