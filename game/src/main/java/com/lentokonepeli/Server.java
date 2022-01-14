package com.lentokonepeli;

import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.util.Properties;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class Server extends WebSocketServer {

    Properties config;
    Game game;

    public Server(Properties conf, InetSocketAddress address) {
        super(address);
        this.config = conf;
        this.game = new Game();
        var debug = Boolean.parseBoolean(conf.getProperty("debug"));
        this.game.setDebug(debug);
        this.game.loadMap(conf.getProperty("map"));
    }

    public void loadMap(String path) {
        this.game.loadMap(path);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        this.game.addConnection(conn);
        System.out.println("New connection to " + conn.getRemoteSocketAddress());
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        this.game.removeConnection(conn);
        System.out.println(
                "closed " + conn.getRemoteSocketAddress() + " with exit code " + code + " additional info: " + reason);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        System.out.println("received message from " + conn.getRemoteSocketAddress() + ": " + message);
    }

    @Override
    public void onMessage(WebSocket conn, ByteBuffer message) {
        System.out.println("received ByteBuffer from " + conn.getRemoteSocketAddress());
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        System.err.println("an error occurred on connection " + conn.getRemoteSocketAddress() + ":" + ex);
    }

    @Override
    public void onStart() {
        System.out.println("server started successfully on " + this.getAddress());
        (new Thread(this.game)).start();
    }

}
