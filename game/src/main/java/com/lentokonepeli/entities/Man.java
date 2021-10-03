package com.lentokonepeli.entities;

import java.util.LinkedHashSet;
import java.util.Map;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Tickable;
import com.lentokonepeli.network.NetType;
import com.lentokonepeli.network.Networkable;
import com.lentokonepeli.network.NetProp;

public class Man extends Entity implements Networkable, Tickable {

    private static final int COORDINATE_RESOLUTION = 100;
    private int x;
    private int y;
    private NetProp<Integer> clientX = new NetProp<>("clientX", NetType.i16);
    private NetProp<Integer> clientY = new NetProp<>("clientY", NetType.i16);
    private final LinkedHashSet<NetProp<?>> props = new LinkedHashSet<>();

    public Man() {
        super(EntityType.MAN);
        props.add(clientX);
        props.add(clientY);
    }

    public void tick(long deltaMS) {
        // System.out.println(deltaMS);
    }

    public LinkedHashSet<NetProp<?>> getProps() {
        return this.props;
    }

}
