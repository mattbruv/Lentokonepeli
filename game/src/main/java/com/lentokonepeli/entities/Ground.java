package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.TerrainType;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class Ground extends Entity {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> width = new NetProp<>("width", NetType.u16);
    private NetProp<Integer> type = new NetProp<>("type", NetType.u8);

    public Ground(int x, int y, int width, TerrainType type) {
        super(EntityType.GROUND);

        props.add(this.x);
        props.add(this.y);
        props.add(this.width);
        props.add(this.type);

        this.x.set(x);
        this.y.set(y);
        this.width.set(width);
        this.type.set(type.ordinal());
    }
}
