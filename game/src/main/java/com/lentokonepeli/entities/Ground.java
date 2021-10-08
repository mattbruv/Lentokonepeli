package com.lentokonepeli.entities;

import java.util.LinkedHashSet;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.network.NetProp;
import com.lentokonepeli.network.Networkable;

public class Ground extends Entity implements Networkable {

    private final LinkedHashSet<NetProp<?>> props = new LinkedHashSet<>();

    public Ground() {
        super(EntityType.GROUND);
    }

    public LinkedHashSet<NetProp<?>> getProps() {
        return this.props;
    }
}
