package com.lentokonepeli;

import java.util.List;
import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.lentokonepeli.entities.Plane;
import com.lentokonepeli.map.MapLoader;
import com.lentokonepeli.network.binary.BinaryPacker;

public class Game implements Runnable {

    private boolean debug = false;
    private List<WebSocket> connections;
    private GameToolkit toolkit;

    private long tick = 0;
    private long lastTick = System.currentTimeMillis();

    // 1000 / 100 = 10 ticks per second
    private final long tickRate = 10L; // milliseconds

    public Game() {
        this.connections = new ArrayList<>();
        this.toolkit = new GameToolkit();
        this.testSleep();
    }

    public void testSetup() {
        // lets start with planes
        System.out.println("DEBUG FUNCTION CALLED...");
        var p = new Plane();
        this.toolkit.addEntity(p);
        this.toolkit.applyAddedEntities();
    }

    public void loadMap(String path) {
        MapLoader.loadMapFromFile(path, this.toolkit);
        this.toolkit.applyAddedEntities();
    }

    public void run() {

        // long sumOfDeltas = 0;

        while (true) {
            tick++;
            long t1 = System.currentTimeMillis();
            long deltaMS = t1 - lastTick;
            // sumOfDeltas += deltaMS;
            // System.out.println("delta: " + deltaMS);
            // System.out.println("desired delay (ms): " + tickRate + ", ticks " + tick + ",
            // avg delay (ms): "
            // + ((double) sumOfDeltas / (double) tick));
            lastTick = t1;
            long nextTick = t1 + this.tickRate;

            // game loop, do stuff here...
            this.performGameTick(deltaMS);

            this.broadcastChanges();

            long t2 = System.currentTimeMillis();

            if (t2 < nextTick) {
                try {
                    long diff = nextTick - t2;
                    // System.out.println("sleep for " + diff);
                    Thread.sleep(diff);
                    /*
                     * A note about sleep time: Thread.sleep() in Java (at least on my laptop and
                     * according to other people on stackoverflow seems to be consistently off by
                     * anywhere from 2-10ms. It doesn't look like the original game compensated for
                     * this. It always set the sleep delay to ((start_time + 10 ms) - end_time) It
                     * appears that 10MS is the original expected time between ticks which all
                     * physics and timing is based off of.
                     * 
                     * May need to adjust this down the line to make it more consistent to 10MS
                     */
                } catch (InterruptedException e) {
                }
            }
        }
    }

    private void performGameTick(long deltaMS) {
        var entities = this.toolkit.getEntities();

        for (var entity : entities.values()) {
            if (entity instanceof Tickable) {
                ((Tickable) entity).tick(deltaMS);
            }
        }
    }

    private void broadcastChanges() {
        var packet = getChanges();
        if (packet.length > 0) {
            for (var ws : connections) {
                ws.send(packet);
            }
        }
    }

    private byte[] getAllState() {
        BinaryPacker packer = new BinaryPacker();
        var entities = this.toolkit.getEntities();
        packer.packState(entities, false);
        return packer.getBinary();
    }

    private byte[] getChanges() {
        BinaryPacker packer = new BinaryPacker();
        var entities = this.toolkit.getEntities();
        packer.packState(entities, true);
        return packer.getBinary();
    }

    public boolean addConnection(WebSocket conn) {

        boolean res = this.connections.add(conn);
        System.out.println(this.connections.size() + " connections");

        var state = getAllState();
        if (state.length > 1) {
            conn.send(state);
        }

        return res;
    }

    public boolean removeConnection(WebSocket conn) {
        boolean res = this.connections.remove(conn);
        System.out.println(this.connections.size() + " connections");
        return res;
    }

    /*
     * Original function the Aapeli servers used to test sleep accuracy. On my
     * machine, this averages out to 150, whree they only seem to call it
     * "innacurate" if it's more than 200.
     */
    protected void testSleep() {
        System.out.println("Testing sleep accuracy...");
        long l = System.currentTimeMillis();
        for (int i = 0; i < 100; i++) {
            try {
                Thread.sleep(1L);
            } catch (InterruptedException localInterruptedException) {
            }
        }
        l = System.currentTimeMillis() - l;
        System.out.println("Sleep test result: 100x1ms -> " + l + "ms");
        if (l > 200L) {
            System.out.println("WARNING, sleeping is not accurate!");
        }
    }

    public void setDebug(boolean debug) {
        System.out.println("Debug: " + debug);
        this.debug = debug;
    }

}
