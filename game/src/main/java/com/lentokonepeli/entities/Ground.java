package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class Ground extends Entity {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> width = new NetProp<>("width", NetType.i16);

    public Ground() {
        super(EntityType.GROUND);
        props.add(x);
        props.add(y);
        props.add(width);
    }
}
