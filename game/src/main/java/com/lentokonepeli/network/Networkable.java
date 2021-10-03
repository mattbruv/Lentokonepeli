package com.lentokonepeli.network;

import java.util.LinkedHashSet;

import com.lentokonepeli.EntityType;

public interface Networkable {

    public int getId();

    public EntityType getType();

    LinkedHashSet<NetProp<?>> getProps();

}
