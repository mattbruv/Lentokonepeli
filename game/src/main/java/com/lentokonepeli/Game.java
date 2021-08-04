package com.lentokonepeli;

import java.util.List;
import java.util.ArrayList;

import org.java_websocket.WebSocket;

public class Game implements Runnable {

    private List<WebSocket> connections;
    private GameState state;
    private long tick = 0;

    // 1000 / 100 = 10 ticks per second
    private final long tickRate = 10; // milliseconds

    public Game() {
        this.connections = new ArrayList<>();
        this.state = new GameState();
    }

    public void run() {

        while (true) {
            tick++;
            long t1 = System.currentTimeMillis();
            long nextTick = t1 + this.tickRate;

            // game loop, do stuff here...
            if (tick % 500 == 0) {
                System.out.println("game loop " + tick + " " + t1);
                for (WebSocket ws : connections) {
                    ws.send("tick: " + tick);
                }
            }

            long t2 = System.currentTimeMillis();

            if (t2 < nextTick) {
                try {
                    long diff = nextTick - t2;
                    // System.out.println(diff);
                    Thread.sleep(diff);
                } catch (InterruptedException e) {
                }
            }
        }
    }

    public boolean addConnection(WebSocket conn) {
        boolean res = this.connections.add(conn);
        System.out.println(this.connections.size() + " connections");
        return res;
    }

    public boolean removeConnection(WebSocket conn) {
        boolean res = this.connections.remove(conn);
        System.out.println(this.connections.size() + " connections");
        return res;
    }

}
