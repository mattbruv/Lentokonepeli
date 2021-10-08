package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Tickable;
import com.lentokonepeli.network.NetType;
import com.lentokonepeli.network.NetProp;

public class Man extends Entity implements Tickable {

    private static final int COORDINATE_RESOLUTION = 100;
    private int x;
    private int y;
    private NetProp<Integer> clientX = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> clientY = new NetProp<>("y", NetType.i16);

    public Man() {
        super(EntityType.MAN);
        props.add(clientX);
        props.add(clientY);
        clientX.set(Integer.valueOf(10));
        clientY.set(Integer.valueOf(10));
    }

    public void tick(long deltaMS) {
    }

    public void setX(int clientX) {
        this.clientX.set(Integer.valueOf(clientX));
        this.x = clientX * COORDINATE_RESOLUTION;
    }

}
