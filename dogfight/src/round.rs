use crate::{
    collision::SolidEntity,
    entities::{
        player::PlayerState,
        types::Team,
        world_info::{GameMode, WorldState},
    },
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
                let min_elapsed =
                    self.round_ticks > MIN_INTERMISSION_TICKS || self.game_mode == GameMode::Rounds;
                if self.round_ticks >= self.intermission_ticks || (min_elapsed && all_ready) {
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

    fn team_eliminated(&self, team: Team) -> bool {
        if self.game_mode != GameMode::Rounds || self.time_winner == Some(team) {
            return false;
        }
        let mut members = self
            .players
            .get_map()
            .values()
            .filter(|p| *p.get_team() == Some(team))
            .peekable();
        members.peek().is_some() && members.all(|p| p.get_state() == PlayerState::Spectating)
    }

    fn team_alive(&self, team: Team) -> bool {
        if self.team_eliminated(team) {
            return false;
        }

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
        if self.game_mode == GameMode::Rounds {
            if let Some(team) = winner {
                self.world_info.add_team_win(team);
            }
        }
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

        let keep_team = self.game_mode == GameMode::Rounds;
        for (_, player) in self.players.get_map_mut() {
            player.reset_for_round(keep_team);
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
        entities::{
            container::PlayerId,
            plane::PlaneType,
            player::{ControllingEntity, PlayerGuid, PlayerState},
            types::Team,
            world_info::{GameMode, WorldState},
        },
        input::{game_input_from_string, RunwaySelection},
        network::encoding::NetworkedBytes,
        replay::file::ReplayFile,
        tick_actions::{Action, RemoveData},
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

    fn add_player(world: &mut World, guid: &str) {
        let input = format!(
            r#"[{{"player_guid":"{guid}","command":{{"type":"AddPlayer","data":{{"guid":"{guid}","name":"{guid}","clan":null}}}}}}]"#
        );
        world.tick(game_input_from_string(input));
    }

    fn player_id(world: &World, guid: &str) -> PlayerId {
        *world
            .get_player_from_guid(&PlayerGuid::from(guid))
            .unwrap()
            .0
    }

    fn take_off(world: &mut World, guid: &str, team: Team) {
        let runway_id = *world
            .runways
            .get_map()
            .iter()
            .find(|(_, r)| *r.get_team() == team)
            .unwrap()
            .0;
        world.process_takeoff(
            &PlayerGuid::from(guid),
            RunwaySelection {
                runway_id,
                plane_type: PlaneType::for_team(team, 0),
            },
        );
    }

    fn shoot_down(world: &mut World, guid: &str) {
        let id = player_id(world, guid);
        let Some(ControllingEntity::Plane(plane_id)) =
            world.players.get(id).unwrap().get_controlling()
        else {
            panic!("player is not flying");
        };
        world.process_actions(vec![Action::RemoveEntity(RemoveData::Plane(plane_id))]);
    }

    fn rounds_world_with_two_teams() -> World {
        let mut world = world_with_level(0, 5);
        world.set_game_mode(GameMode::Rounds);
        add_player(&mut world, "a");
        add_player(&mut world, "b");
        world.choose_team(&PlayerGuid::from("a"), Some(Team::Centrals));
        world.choose_team(&PlayerGuid::from("b"), Some(Team::Allies));
        take_off(&mut world, "a", Team::Centrals);
        take_off(&mut world, "b", Team::Allies);
        world
    }

    #[test]
    fn normal_mode_dead_players_respawn() {
        let mut world = world_with_level(0, 5);
        add_player(&mut world, "a");
        add_player(&mut world, "b");
        world.choose_team(&PlayerGuid::from("a"), Some(Team::Centrals));
        world.choose_team(&PlayerGuid::from("b"), Some(Team::Allies));
        take_off(&mut world, "a", Team::Centrals);
        shoot_down(&mut world, "a");
        world.tick(vec![]);

        let a = world.players.get(player_id(&world, "a")).unwrap();
        assert_eq!(a.get_state(), PlayerState::WaitingRespawn);
        assert_eq!(world.world_info.get_state(), WorldState::Playing);
    }

    #[test]
    fn rounds_mode_eliminating_a_team_wins_the_round() {
        let mut world = rounds_world_with_two_teams();

        shoot_down(&mut world, "b");
        let b = world.players.get(player_id(&world, "b")).unwrap();
        assert_eq!(b.get_state(), PlayerState::Spectating);

        world.tick(vec![]);
        assert_eq!(world.world_info.get_state(), WorldState::PostGame);
        assert_eq!(world.world_info.get_team_wins(Team::Centrals), 1);
        assert_eq!(world.world_info.get_team_wins(Team::Allies), 0);

        for _ in 0..500 {
            world.tick(vec![]);
        }
        assert_eq!(world.world_info.get_state(), WorldState::Intermission);
        for _ in 0..500 {
            world.tick(vec![]);
        }
        assert_eq!(world.world_info.get_state(), WorldState::Playing);

        for guid in ["a", "b"] {
            let p = world.players.get(player_id(&world, guid)).unwrap();
            assert_eq!(p.get_state(), PlayerState::ChoosingRunway);
            assert!(p.get_team().is_some());
        }
        let b = world.players.get(player_id(&world, "b")).unwrap();
        assert_eq!(b.get_deaths(), 0);
        assert_eq!(world.world_info.get_team_wins(Team::Centrals), 1);
    }

    #[test]
    fn rounds_mode_spectator_follows_living_teammate() {
        let mut world = rounds_world_with_two_teams();
        add_player(&mut world, "c");
        let c_id = player_id(&world, "c");
        assert_eq!(
            world.players.get(c_id).unwrap().get_state(),
            PlayerState::Spectating
        );
        assert_eq!(
            world.choose_team(&PlayerGuid::from("c"), Some(Team::Allies)),
            None
        );

        for _ in 0..301 {
            world.tick(vec![]);
        }
        assert!(world.players.get(c_id).unwrap().get_spectating().is_some());
        assert_eq!(world.world_info.get_state(), WorldState::Playing);
    }

    #[test]
    fn game_mode_survives_replay_round_trip() {
        let mut world = world_with_level(5, 20);
        world.set_game_mode(GameMode::Rounds);
        let bytes = world.get_replay_file_bytes();
        let (_, replay) = ReplayFile::from_bytes(&bytes).unwrap();
        assert_eq!(replay.game_mode, GameMode::Rounds);

        let without_mode = &bytes[..bytes.len() - 1];
        let (_, old) = ReplayFile::from_bytes(without_mode).unwrap();
        assert_eq!(old.game_mode, GameMode::Normal);
        assert_eq!(old.game_time_minutes, 5);
    }
}
