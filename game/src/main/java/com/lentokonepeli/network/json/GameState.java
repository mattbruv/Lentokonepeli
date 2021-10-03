package com.lentokonepeli.network.json;

import java.util.ArrayList;
import java.util.List;

import com.lentokonepeli.network.NetPacket;

public class GameState {
    public int type = NetPacket.GAME_STATE.ordinal();
    public List<ObjectState> data = new ArrayList<>();
}
