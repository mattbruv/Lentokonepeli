package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Tickable;
import com.lentokonepeli.network.NetType;
import com.lentokonepeli.network.NetProp;

public class Plane extends Entity implements Tickable {

    public enum PlaneType {
        ALBATROS,
        BRISTOL,
        FOKKER,
        JUNKERS,
        SALMSON,
        SOPWITH,
    }

    public enum PlaneState {
        FLYING,
        LANDING,
        LANDED,
        TAKING_OFF,
        FALLING,
        DODGING,
    }

    private static final int COORDINATE_RESOLUTION = 100;
    private static final int DIRECTIONS = 256;
    private static final int MAX_Y = -570;
    private static final int SKY_HEIGHT = 500;
    private static final int speedPerPixel = 100;

    private int x;
    private int y;
    private PlaneState state;

    private NetProp<Integer> clientX = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> clientY = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> direction = new NetProp<>("direction", NetType.u8);
    private NetProp<Integer> planeType = new NetProp<>("planeType", NetType.u8);

    public Plane() {
        super(EntityType.PLANE);

        props.add(clientX);
        props.add(clientY);
        props.add(direction);
        props.add(planeType);

        clientX.set(Integer.valueOf(250));
        clientY.set(Integer.valueOf(-350));
        direction.set(Integer.valueOf(256 / 4));
        planeType.set(PlaneType.FOKKER.ordinal());
    }

    private double getRadians(int direction) {
        return Math.PI * 2 * direction / DIRECTIONS;
    }

    public void tick(long deltaMS) {
        var dir = this.direction.get() + 1;
        if (dir >= DIRECTIONS) {
            this.direction.set(Integer.valueOf(0));
        } else {
            this.direction.set(Integer.valueOf(dir));
        }

        if (Math.random() > 0.98) {

            var idx = (int) Math.floor(Math.random() * 6);
            this.planeType.set(Integer.valueOf(idx));
        }
    }

}
