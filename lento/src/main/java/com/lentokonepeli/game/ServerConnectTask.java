package com.lentokonepeli.game;

// import java.net.InetAddress;
// import java.net.URI;
// import java.net.http.HttpRequest;
// import java.net.http.HttpClient;
import java.util.TimerTask;

/*
    The point of this class is to create a scheduled
    event where our game server tries to reach out
    to the central server and alert it that we exist.

    Give it our details, along with a JWT verifiying
    authenticity.

    Once the main server has our info, it will send
    a websocket request to us.
*/
public class ServerConnectTask extends TimerTask {

    GameServer gameServer;
    // HttpClient httpclient = HttpClient.newHttpClient();
    String mainURL;
    String mainPort;

    public ServerConnectTask(GameServer gameServer) {
        this.gameServer = gameServer;
        this.mainURL = gameServer.config.getProperty("main.url");
        this.mainPort = gameServer.config.getProperty("main.port");
    }

    public void run() {
        if (this.gameServer.mainServerSocket != null) {
            return;
        }
        System.out.println("Not connected to main server... reaching out.");
    }
}