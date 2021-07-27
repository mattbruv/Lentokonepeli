package com.lentokonepeli.game;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.Properties;

import org.java_websocket.server.WebSocketServer;

public class App {

  public static void main(String[] args) {

    Properties config = new Properties();

    try {
      config.load(new FileInputStream("app.config"));
    } catch (IOException e) {
      e.printStackTrace();
    }

    String host = config.getProperty("url");
    int port = Integer.parseInt(config.getProperty("port"));

    WebSocketServer server = new GameServer(config, new InetSocketAddress(host, port));

    server.run();
  }
}
