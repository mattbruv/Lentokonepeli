export enum ConnectionState {
  CONNECTING,
  OPEN,
  CLOSED
}
export const ClientState = {
  showPlayers: false,
  connection: ConnectionState.CONNECTING
};
