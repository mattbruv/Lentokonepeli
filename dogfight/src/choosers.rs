use crate::{
    collision::SolidEntity,
    entities::{
        container::{EntityId, PlayerId, RunwayId},
        plane::PlaneType,
        player::{PlayerGuid, PlayerState},
        types::Team,
        world_info::WorldState,
    },
    input::RunwaySelection,
    output::ServerOutput,
    world::World,
};

const TEAM_CHOICES: [Option<Team>; 3] = [Some(Team::Centrals), None, Some(Team::Allies)];

enum ChooserRequest {
    Team(PlayerGuid, Option<Team>),
    Takeoff(PlayerGuid, RunwaySelection),
}

impl World {
    fn team_runways(&self, team: Team) -> Vec<RunwayId> {
        self.runways
            .get_map()
            .iter()
            .filter(|(_, runway)| *runway.get_team() == team && runway.is_alive())
            .map(|(id, _)| *id)
            .collect()
    }

    pub(crate) fn tick_choosers(&mut self) -> Vec<ServerOutput> {
        let intermission = self.world_info.get_state() == WorldState::Intermission;
        let centrals_runways = self.team_runways(Team::Centrals);
        let allies_runways = self.team_runways(Team::Allies);
        let rules = self.rules;
        let mut requests = vec![];

        let mut active: Vec<(PlayerId, Option<Team>)> = self
            .players
            .get_map()
            .iter()
            .filter(|(_, p)| p.get_state() != PlayerState::Spectating)
            .map(|(id, p)| (*id, *p.get_team()))
            .collect();
        active.sort_by_key(|(id, _)| id.raw_value());

        for (id, player) in self.players.get_map_mut() {
            let keys = *player.get_keys();
            let enter_pressed = keys.enter && !player.get_previous_keys().enter;
            let can_move = player.advance_chooser_timer();

            if !intermission {
                match (
                    player.get_state(),
                    *player.get_team(),
                    player.get_controlling(),
                ) {
                    (PlayerState::ChoosingTeam, None, _) => {
                        let option = player.get_team_option();
                        if can_move {
                            if keys.left && option > 0 {
                                player.set_team_option(option - 1);
                                player.reset_chooser_timer();
                            } else if keys.right && option < 2 {
                                player.set_team_option(option + 1);
                                player.reset_chooser_timer();
                            }
                        }
                        if enter_pressed {
                            let choice = TEAM_CHOICES[player.get_team_option() as usize];
                            requests.push(ChooserRequest::Team(player.get_guid().clone(), choice));
                        }
                    }
                    (PlayerState::ChoosingRunway, Some(team), None) => {
                        let runways = match team {
                            Team::Centrals => &centrals_runways,
                            Team::Allies => &allies_runways,
                        };

                        let selected = player
                            .get_selected_runway()
                            .filter(|id| runways.contains(id))
                            .or_else(|| player.get_last_runway().filter(|id| runways.contains(id)))
                            .or_else(|| runways.first().copied());
                        player.set_selected_runway(selected);

                        let current = player.get_selected_plane();
                        let allowed = rules.allowed_plane_index(team, current, 1);
                        if allowed != current {
                            player.set_selected_plane(allowed);
                        }

                        if can_move {
                            let plane = player.get_selected_plane();
                            let index =
                                selected.and_then(|id| runways.iter().position(|r| *r == id));
                            if keys.up {
                                player.set_selected_plane(rules.allowed_plane_index(
                                    team,
                                    plane + 2,
                                    2,
                                ));
                                player.reset_chooser_timer();
                            } else if keys.down {
                                player.set_selected_plane(rules.allowed_plane_index(
                                    team,
                                    plane + 1,
                                    1,
                                ));
                                player.reset_chooser_timer();
                            } else if keys.left || keys.right {
                                if let Some(index) = index {
                                    let count = runways.len();
                                    let next = if keys.left {
                                        (index + count - 1) % count
                                    } else {
                                        (index + 1) % count
                                    };
                                    player.set_selected_runway(Some(runways[next]));
                                }
                                player.reset_chooser_timer();
                            }
                        }

                        if player.hold_takeoff(enter_pressed, keys.enter) {
                            if let Some(runway_id) = player.get_selected_runway() {
                                requests.push(ChooserRequest::Takeoff(
                                    player.get_guid().clone(),
                                    RunwaySelection {
                                        runway_id,
                                        plane_type: PlaneType::for_team(
                                            team,
                                            player.get_selected_plane(),
                                        ),
                                    },
                                ));
                            }
                        }
                    }
                    (PlayerState::Spectating, team, _) => {
                        if player.advance_spectate_timer() {
                            let candidates: Vec<PlayerId> = active
                                .iter()
                                .filter(|(pid, t)| pid != id && (team.is_none() || *t == team))
                                .map(|(pid, _)| *pid)
                                .collect();
                            let current = player
                                .get_spectating()
                                .and_then(|c| candidates.iter().position(|x| *x == c));
                            let step = if can_move && keys.left {
                                Some(-1)
                            } else if can_move && keys.right {
                                Some(1)
                            } else {
                                None
                            };
                            if step.is_some() {
                                player.reset_chooser_timer();
                            }
                            let next = match (current, step) {
                                _ if candidates.is_empty() => None,
                                (Some(i), Some(d)) => {
                                    Some((i as isize + d).rem_euclid(candidates.len() as isize)
                                        as usize)
                                }
                                (Some(i), None) => Some(i),
                                (None, _) => Some(0),
                            };
                            player.set_spectating(next.map(|i| candidates[i]));
                        }
                    }
                    _ => {}
                }
            }

            player.remember_keys();
        }

        let mut output = vec![];
        for request in requests {
            match request {
                ChooserRequest::Team(guid, choice) => {
                    if let Some((id, team)) = self.choose_team(&guid, choice) {
                        output.push(ServerOutput::PlayerJoinTeam { id, team });
                    }
                }
                ChooserRequest::Takeoff(guid, selection) => {
                    self.process_takeoff(&guid, selection);
                }
            }
        }
        output
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        entities::{player::PlayerState, types::Team},
        input::game_input_from_string,
        world::World,
    };

    const CLASSIC: &str = r#"classic
layer1=...H.....H.....H.....H.....H.....H.....H.....H...
layer2=...R.........................................l...
layer3=........R...............................l........
layer4=...F....T...............................t....f...
layer5=\<#############################################>/
designer=polofel"#;

    fn keys(left: bool, right: bool, up: bool, down: bool, enter: bool) -> String {
        format!(
            r#"[{{"player_guid":"p","command":{{"type":"PlayerKeyboard","data":{{"left":{left},"right":{right},"down":{down},"up":{up},"shift":false,"space":false,"enter":{enter},"ctrl":false}}}}}}]"#
        )
    }

    fn tick(world: &mut World, input: &str, count: u32) {
        world.tick(game_input_from_string(input.to_string()));
        for _ in 1..count {
            world.tick(vec![]);
        }
    }

    #[test]
    fn keyboard_drives_team_and_plane_choosers() {
        let mut world = World::new();
        world.load_level(CLASSIC);
        tick(
            &mut world,
            r#"[{"player_guid":"p","command":{"type":"AddPlayer","data":{"guid":"p","name":"P","clan":null}}}]"#,
            1,
        );

        let player = |world: &World| {
            world
                .players
                .get_map()
                .values()
                .next()
                .unwrap()
                .get_team_option()
        };
        assert_eq!(player(&world), 1);

        tick(&mut world, &keys(false, true, false, false, false), 1);
        assert_eq!(player(&world), 2);

        tick(&mut world, &keys(false, false, false, false, true), 1);
        let p = world.players.get_map().values().next().unwrap();
        assert_eq!(*p.get_team(), Some(Team::Allies));
        assert_eq!(p.get_state(), PlayerState::ChoosingRunway);

        tick(&mut world, &keys(false, false, false, false, false), 1);
        let first_runway = world
            .players
            .get_map()
            .values()
            .next()
            .unwrap()
            .get_selected_runway();
        assert!(first_runway.is_some());

        tick(&mut world, &keys(false, false, false, false, false), 20);
        tick(&mut world, &keys(false, false, false, true, false), 1);
        tick(&mut world, &keys(false, false, false, false, false), 20);
        assert_eq!(
            world
                .players
                .get_map()
                .values()
                .next()
                .unwrap()
                .get_selected_plane(),
            1
        );

        tick(&mut world, &keys(false, true, false, false, false), 1);
        let second_runway = world
            .players
            .get_map()
            .values()
            .next()
            .unwrap()
            .get_selected_runway();
        assert!(second_runway.is_some());
        assert_ne!(first_runway, second_runway);
    }
}
