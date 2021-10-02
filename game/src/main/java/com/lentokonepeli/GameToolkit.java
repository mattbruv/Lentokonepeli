package com.lentokonepeli;

import java.util.Map;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

/*
Game Toolkit
Every Entity has a reference to the toolkit, which contains useful things
such as references to all entities in the world
*/

public final class GameToolkit {

    private int nextID = 6;
    private Map<Integer, Entity> entityMap;
    private Map<Integer, Entity> addedMap;
    private List<Integer> removedList;

    public GameToolkit() {
        this.entityMap = Collections.synchronizedMap(new HashMap<>());
        this.addedMap = Collections.synchronizedMap(new HashMap<>());
        this.removedList = Collections.synchronizedList(new ArrayList<Integer>());
    }

    // Taken from the original code
    // Note that it will soft-lock if there are around 2^16 entities
    // Should never happen in practice.
    private synchronized int getFreeID() {
        do {
            this.nextID += 1;
            // Limit IDs to 2 byte range
            if (this.nextID > 65535) {
                this.nextID = 6;
            }
        } while ((this.entityMap.containsKey(Integer.valueOf(this.nextID)))
                || (this.removedList.contains(Integer.valueOf(this.nextID)))
                || (this.addedMap.containsKey(Integer.valueOf(this.nextID))));
        return this.nextID;
    }

    public Map<Integer, Entity> getEntities() {
        synchronized (this.entityMap) {
            var localHashMap = new HashMap<Integer, Entity>(this.entityMap);
            return localHashMap;
        }
    }

    public Entity removeEntity(int id) {
        Entity localEntity = this.entityMap.get(Integer.valueOf(id));

        if (localEntity == null) {
            System.out.println("Could not find id: " + id + " in removeEntity!");
            return null;
        }

        if (!localEntity.isRemoved()) {
            this.entityMap.remove(Integer.valueOf(id));
            localEntity.remove();
            this.removedList.add(Integer.valueOf(id));
            return localEntity;
        }

        System.out.println("Trying to remove entity " + id + " for the second time");
        return null;
    }

    public void addEntity(Entity entity) {
        entity.setToolkit(this);
        entity.setId(getFreeID());
        this.addedMap.put(Integer.valueOf(entity.getId()), entity);
    }

    public Entity getEntity(int paramInt) {
        return this.entityMap.get(Integer.valueOf(paramInt));
    }

}
