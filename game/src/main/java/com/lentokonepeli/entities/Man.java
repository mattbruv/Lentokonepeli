package com.lentokonepeli.entities;

import java.util.LinkedHashSet;

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
    private NetProp<Integer> clientX = new NetProp<>("x", NetType.i16);
    private NetProp<Integer> clientY = new NetProp<>("y", NetType.i16);
    private NetProp<Integer> test = new NetProp<>("f", NetType.i16);
    private NetProp<String> name = new NetProp<>("name", NetType.STRING);
    private final LinkedHashSet<NetProp<?>> props = new LinkedHashSet<>();

    public Man() {
        super(EntityType.MAN);
        props.add(clientX);
        props.add(clientY);
        props.add(test);
        props.add(name);
        clientX.set(Integer.valueOf(0));
        clientY.set(Integer.valueOf(10));
        test.set(Integer.valueOf(0));
        name.set("test" + Math.random());
    }

    public void tick(long deltaMS) {
        if (Math.random() < 0.99) {
            return;
        }
        int newX = this.clientX.get() + 1;
        if (newX > 25) {
            newX = 0;
            test.set(test.get() + 1);
        }
        setX(newX);
    }

    public void setX(int clientX) {
        this.clientX.set(Integer.valueOf(clientX));
        this.x = clientX * COORDINATE_RESOLUTION;
    }

    public LinkedHashSet<NetProp<?>> getProps() {
        return this.props;
    }

}
