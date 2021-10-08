package com.lentokonepeli;

import java.util.LinkedHashSet;

import com.lentokonepeli.network.NetProp;

public abstract class Entity {
    protected GameToolkit toolkit;
    private boolean removed = false;
    protected int id;
    protected final EntityType type;
    protected final LinkedHashSet<NetProp<?>> props = new LinkedHashSet<>();

    public Entity(EntityType type) {
        this.type = type;
    }

    public final void setToolkit(GameToolkit toolkit) {
        this.toolkit = toolkit;
    }

    public final void setId(int id) {
        this.id = id;
    }

    public final int getId() {
        return this.id;
    }

    public final EntityType getType() {
        return this.type;
    }

    public final void remove() {
        if (!this.removed) {
            this.removed = true;
        }
    }

    public final boolean isRemoved() {
        return this.removed;
    }

    public final LinkedHashSet<NetProp<?>> getProps() {
        return this.props;
    }
}
