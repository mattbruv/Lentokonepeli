package com.lentokonepeli.network;

public class NetProp<T> {

    public final String name;
    public final NetType type;

    private boolean isSet = false;
    private boolean isDirty = false;
    private T value;

    public NetProp(String name, NetType type) {
        this.name = name;
        this.type = type;
    }

    public synchronized void set(T value) {
        if (this.value != value) {
            this.value = value;
            this.isSet = true;
            this.isDirty = true;
        }
    }

    public synchronized void setClean() {
        this.isDirty = false;
    }

    public synchronized boolean isSet() {
        return this.isSet;
    }

    public synchronized boolean isDirty() {
        return this.isDirty;
    }

    public synchronized T get() {
        return this.value;
    }

}
