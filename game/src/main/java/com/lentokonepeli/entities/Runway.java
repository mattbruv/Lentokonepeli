package com.lentokonepeli.entities;

import com.lentokonepeli.Direction;
import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Team;
import com.lentokonepeli.Tickable;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class Runway extends Entity implements Tickable {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> team = new NetProp<>("team", NetType.u8);
    private NetProp<Integer> direction = new NetProp<>("direction", NetType.u8);
    private NetProp<Integer> health = new NetProp<>("health", NetType.u8);

    private int deadTimer = 0;

    public Runway(int x, int y, Team team, Direction direction) {
        super(EntityType.RUNWAY);

        props.add(this.x);
        props.add(this.y);
        props.add(this.team);
        props.add(this.direction);
        props.add(this.health);

        this.x.set(x);
        this.y.set(y);
        this.team.set(team.ordinal());
        this.direction.set(direction.ordinal());
        this.health.set(0);
    }

    public void tick(long deltaMS) {
    }
}
