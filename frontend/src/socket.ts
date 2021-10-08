

export class SocketConnection {

    public socket: WebSocket;

    constructor(url: string) {
        this.socket = new WebSocket(url);
        this.socket.binaryType = "arraybuffer";
    }
}