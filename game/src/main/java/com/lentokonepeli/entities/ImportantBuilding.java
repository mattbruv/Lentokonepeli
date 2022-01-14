package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Team;
import com.lentokonepeli.Tickable;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class ImportantBuilding extends Entity implements Tickable {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> team = new NetProp<>("team", NetType.u8);
    private NetProp<Integer> health = new NetProp<>("health", NetType.u8);

    private int timer = 0;
    private int inc = 1;

    public ImportantBuilding(int x, int y, Team team) {
        super(EntityType.IMPORTANT_BUILDING);

        props.add(this.x);
        props.add(this.y);
        props.add(this.team);
        props.add(this.health);

        this.x.set(x);
        this.y.set(y);
        this.team.set(team.ordinal());
        this.health.set(0);
    }

    public void tick(long deltaMS) {
        int hp = this.health.get();
        if (hp == 255) {
            timer++;
            if (timer > 30) {
                timer = 0;
                inc = -1;
                this.health.set(hp + inc);
            }
        } else if (hp == 0) {
            timer++;
            if (timer > 60 * 2) {
                timer = 0;
                inc = 1;
                this.health.set(hp + inc);
            }
        } else {
            this.health.set(hp + inc);
        }
    }
}
