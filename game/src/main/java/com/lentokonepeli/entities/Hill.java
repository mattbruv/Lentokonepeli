package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.TerrainType;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class Hill extends Entity {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> type = new NetProp<>("type", NetType.u8);

    public Hill(int x, int y, TerrainType type) {
        super(EntityType.HILL);

        props.add(this.x);
        props.add(this.y);
        props.add(this.type);

        this.x.set(x);
        this.y.set(y);
        this.type.set(type.ordinal());
    }
}
