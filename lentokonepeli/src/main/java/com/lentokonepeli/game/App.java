package com.lentokonepeli.game;

import java.net.InetSocketAddress;
import org.java_websocket.server.WebSocketServer;

public class App {
  public static void main(String[] args) {

    String host = "localhost";
    int port = 6969;

    WebSocketServer server = new GameServer(new InetSocketAddress(host, port));
    server.run();
  }
}
