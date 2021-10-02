package com.lentokonepeli;

import java.util.List;
import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.lentokonepeli.entities.Man;

public class Game implements Runnable {

    private List<WebSocket> connections;
    private GameToolkit toolkit;

    private long tick = 0;
    private long lastTick = System.currentTimeMillis();

    // 1000 / 100 = 10 ticks per second
    private final long tickRate = 10L; // milliseconds

    public Game() {
        this.connections = new ArrayList<>();
        this.toolkit = new GameToolkit();
        this.test();
        this.toolkit.applyAddedEntities();
        System.out.println(this.toolkit.getEntities());
    }

    private void test() {
        Man m = new Man();
        Man m2 = new Man();
        this.toolkit.addEntity(m);
        this.toolkit.addEntity(m2);
        this.toolkit.addEntity(m);
    }

    public void run() {

        long sumOfDeltas = 0;

        while (true) {
            tick++;
            long t1 = System.currentTimeMillis();
            long deltaMS = t1 - lastTick;
            sumOfDeltas += deltaMS;
            System.out.println("delta: " + deltaMS);
            System.out.println("desired delay (ms): " + tickRate + ", ticks " + tick + ", avg delay (ms): "
                    + ((double) sumOfDeltas / (double) tick));
            lastTick = t1;
            long nextTick = t1 + this.tickRate;

            // game loop, do stuff here...
            this.performGameTick(deltaMS);

            long t2 = System.currentTimeMillis();

            if (t2 < nextTick) {
                try {
                    long diff = nextTick - t2;
                    // System.out.println("sleep for " + diff);
                    Thread.sleep(diff);
                } catch (InterruptedException e) {
                }
            }
        }
    }

    private void performGameTick(long deltaMS) {
        var entities = this.toolkit.getEntities();

        for (var entry : entities.entrySet()) {
            var entity = entry.getValue();
            if (entity instanceof Tickable) {
                ((Tickable) entity).tick(deltaMS);
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
