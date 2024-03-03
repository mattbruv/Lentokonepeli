use dogfight::game::Game;

fn main() {
    let mut g: Game = Game::new();
    println!("Hello, world!");
    g.tick();
}
