package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Direction;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class Palm extends Entity {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> direction = new NetProp<>("direction", NetType.u8);

    public Palm(int x, int y, Direction direction) {
        super(EntityType.PALM);

        props.add(this.x);
        props.add(this.y);
        props.add(this.direction);

        this.x.set(x);
        this.y.set(y);
        this.direction.set(direction.ordinal());
    }
}
