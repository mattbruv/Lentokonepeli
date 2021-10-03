package com.lentokonepeli;

public abstract class Entity {
    protected GameToolkit toolkit;
    private boolean removed = false;
    protected int id;
    protected final EntityType type;

    public Entity(EntityType type) {
        this.type = type;
    }

    public void setToolkit(GameToolkit toolkit) {
        this.toolkit = toolkit;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getId() {
        return this.id;
    }

    public EntityType getType() {
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
}
