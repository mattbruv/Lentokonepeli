use crate::{
    collision::SolidEntity,
    entities::{types::Team, world_info::WorldState},
    input::PlayerKeyboard,
    world::World,
};

const ROUND_OVER_TICKS: u32 = 500;
const MIN_INTERMISSION_TICKS: u32 = 300;

impl World {
    pub(crate) fn tick_round(&mut self) {
        self.round_ticks += 1;

        match self.world_info.get_state() {
            WorldState::Playing => {
                if let Some(winner) = self.check_round_winner() {
                    self.round_over(winner);
                }
            }
            WorldState::PostGame => {
                self.round_over_ticks += 1;
                if self.round_over_ticks >= ROUND_OVER_TICKS {
                    self.finish_round();
                }
            }
            WorldState::Intermission => {
                for (_, player) in self.players.get_map_mut() {
                    if player.get_keys().enter {
                        player.set_ready(true);
                    }
                }

                let all_ready = self.players.get_map().values().all(|p| p.is_ready());
                if self.round_ticks >= self.intermission_ticks
                    || (self.round_ticks > MIN_INTERMISSION_TICKS && all_ready)
                {
                    self.start_round();
                }
            }
        }

        self.update_clock();
    }

    pub(crate) fn is_round_over(&self) -> bool {
        self.world_info.get_state() != WorldState::Playing
    }

    fn update_clock(&mut self) {
        let limit = match self.world_info.get_state() {
            WorldState::Intermission => Some(self.intermission_ticks),
            _ if self.game_time_ticks > 0 => Some(self.game_time_ticks),
            _ => None,
        };

        let seconds = limit.map(|limit| (limit.saturating_sub(self.round_ticks) / 100) as u16);
        self.world_info.set_time_left(seconds);
    }

    fn team_alive(&self, team: Team) -> bool {
        let mut has_runway = false;
        let mut runway_alive = false;
        for runway in self.runways.get_map().values() {
            if *runway.get_team() == team {
                has_runway = true;
                runway_alive |= runway.is_alive();
            }
        }

        if !has_runway {
            return true;
        }

        let mut has_headquarters = false;
        let mut headquarters_alive = false;
        for bunker in self.bunkers.get_map().values() {
            if *bunker.get_team() == team {
                has_headquarters = true;
                headquarters_alive |= bunker.is_alive();
            }
        }

        if has_headquarters {
            headquarters_alive && runway_alive
        } else {
            runway_alive
        }
    }

    fn check_round_winner(&self) -> Option<Option<Team>> {
        if !self.team_alive(Team::Centrals) {
            return Some(Some(Team::Allies));
        }
        if !self.team_alive(Team::Allies) {
            return Some(Some(Team::Centrals));
        }

        if self.game_time_ticks > 0 && self.round_ticks >= self.game_time_ticks {
            if let Some(team) = self.time_winner {
                return Some(Some(team));
            }
            let centrals = self.world_info.get_team_score(Team::Centrals);
            let allies = self.world_info.get_team_score(Team::Allies);
            return Some(match centrals.cmp(&allies) {
                std::cmp::Ordering::Greater => Some(Team::Centrals),
                std::cmp::Ordering::Less => Some(Team::Allies),
                std::cmp::Ordering::Equal => None,
            });
        }

        None
    }

    fn round_over(&mut self, winner: Option<Team>) {
        self.world_info.set_winner(winner);
        self.world_info.set_state(WorldState::PostGame);
        self.round_over_ticks = 0;
    }

    fn finish_round(&mut self) {
        self.clear_dynamic_entities();

        for (_, player) in self.players.get_map_mut() {
            player.set_controlling(None);
            player.set_keys(PlayerKeyboard::new());
            player.set_ready(false);
        }

        self.world_info.set_state(WorldState::Intermission);
        self.round_ticks = 0;
    }

    fn start_round(&mut self) {
        self.clear_dynamic_entities();

        for (_, player) in self.players.get_map_mut() {
            player.reset_for_round();
        }

        for (_, runway) in self.runways.get_map_mut() {
            runway.reset();
        }

        for (_, bunker) in self.bunkers.get_map_mut() {
            bunker.reset();
        }

        self.world_info.reset_team_scores();
        self.world_info.set_winner(None);
        self.world_info.set_state(WorldState::Playing);
        self.round_ticks = 0;
    }

    fn clear_dynamic_entities(&mut self) {
        let planes: Vec<_> = self.planes.get_map().keys().copied().collect();
        for id in planes {
            self.planes.remove(id);
        }
        let men: Vec<_> = self.men.get_map().keys().copied().collect();
        for id in men {
            self.men.remove(id);
        }
        let bombs: Vec<_> = self.bombs.get_map().keys().copied().collect();
        for id in bombs {
            self.bombs.remove(id);
        }
        let bullets: Vec<_> = self.bullets.get_map().keys().copied().collect();
        for id in bullets {
            self.bullets.remove(id);
        }
        let explosions: Vec<_> = self.explosions.get_map().keys().copied().collect();
        for id in explosions {
            self.explosions.remove(id);
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        collision::SolidEntity,
        entities::{types::Team, world_info::WorldState},
        world::World,
    };

    const CLASSIC: &str = r#"classic
layer1=...H.....H.....H.....H.....H.....H.....H.....H...
layer2=...R.........................................l...
layer3=........R...............................l........
layer4=...F....T...............................t....f...
layer5=\<#############################################>/
designer=polofel"#;

    fn world_with_level(game_time_minutes: u16, intermission_seconds: u16) -> World {
        let mut world = World::new();
        world.load_level(CLASSIC);
        world.set_round_settings(game_time_minutes, intermission_seconds);
        world
    }

    #[test]
    fn destroying_all_runways_ends_round_and_restarts() {
        let mut world = world_with_level(0, 5);

        for (_, runway) in world.runways.get_map_mut() {
            if *runway.get_team() == Team::Allies {
                runway.subtract_health(100_000);
            }
        }

        world.tick(vec![]);
        assert_eq!(world.world_info.get_state(), WorldState::PostGame);

        for _ in 0..500 {
            world.tick(vec![]);
        }
        assert_eq!(world.world_info.get_state(), WorldState::Intermission);

        for _ in 0..500 {
            world.tick(vec![]);
        }
        assert_eq!(world.world_info.get_state(), WorldState::Playing);
        assert!(world.runways.get_map().values().all(|r| r.is_alive()));
    }

    #[test]
    fn time_limit_with_equal_scores_is_a_tie() {
        let mut world = world_with_level(1, 20);

        for _ in 0..5_999 {
            world.tick(vec![]);
        }
        assert_eq!(world.world_info.get_state(), WorldState::Playing);

        world.tick(vec![]);
        assert_eq!(world.world_info.get_state(), WorldState::PostGame);
        assert!(world.is_round_over());
    }
}
