package com.lentokonepeli.entities;

import com.lentokonepeli.Entity;
import com.lentokonepeli.EntityType;
import com.lentokonepeli.Tickable;

public class Man extends Entity implements Tickable {
    public Man() {
        super(EntityType.MAN);
    }

    public void tick(long deltaMS) {
        // System.out.println(deltaMS);
    }
}
