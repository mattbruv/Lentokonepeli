package com.lentokonepeli.entities;

import com.lentokonepeli.BackgroundItemType;
import com.lentokonepeli.Direction;
import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.NetType;

public class BackgroundItem extends Entity {

    private NetProp<Integer> x = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> y = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> subType = new NetProp<>("subType", NetType.u8);
    private NetProp<Integer> direction = new NetProp<>("direction", NetType.u8);

    public BackgroundItem(int x, int y, BackgroundItemType type, Direction direction) {
        super(EntityType.BACKGROUND_ITEM);

        props.add(this.x);
        props.add(this.y);
        props.add(this.subType);
        props.add(this.direction);

        this.x.set(x);
        this.y.set(y);
        this.subType.set(type.ordinal());
        this.direction.set(direction.ordinal());
    }
}
