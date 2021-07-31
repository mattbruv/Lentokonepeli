package com.lentokonepeli;

/* 
    Game.java
    this is the overall architect of the game that uses the data stored in its
    singular reference to a GameState in order to make decisions about players moves(*requests as before),
    and broadcast reactions to those moves. 
    (sends out updates to the GameState
*/

public class Game implements Runnable {

    GameState state;

    public Game() {
        this.state = new GameState();
    }

    public void run() {
        // game loop
    }

}
