package com.lentokonepeli.network.json;

import java.util.Map;

import com.google.gson.Gson;
import com.lentokonepeli.Entity;
import com.lentokonepeli.network.Networkable;

public class StringPacker {

    private GameState state = new GameState();

    public void packState(Map<Integer, Entity> entities, boolean onlyChanges) {

        for (var ent : entities.values()) {
            if (ent instanceof Networkable) {
                var props = ((Networkable) ent).getProps();
                var obj = new ObjectState();
                obj.type = ent.getType().ordinal();
                obj.id = ent.getId();
                for (var prop : props) {
                    if (prop.isSet()) {
                        if (onlyChanges) {
                            if (prop.isDirty()) {
                                obj.data.put(prop.name, prop.get());
                                prop.setClean();
                            }
                        } else {
                            obj.data.put(prop.name, prop.get());
                        }
                    }
                }
                if (obj.data.size() > 0) {
                    state.data.add(obj);
                }
            }
        }

    }

    public String getJSON() {
        Gson gson = new Gson();
        if (this.state.data.size() > 0)
            return gson.toJson(this.state);
        else
            return null;
    }

}
