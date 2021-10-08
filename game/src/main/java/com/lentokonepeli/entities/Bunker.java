package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Team;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class Bunker extends Entity {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> team = new NetProp<>("team", NetType.u8);

    public Bunker(int x, int y, Team team) {
        super(EntityType.IMPORTANT_BUILDING);

        props.add(this.x);
        props.add(this.y);
        props.add(this.team);

        this.x.set(x);
        this.y.set(y);
        this.team.set(team.ordinal());
    }
}
