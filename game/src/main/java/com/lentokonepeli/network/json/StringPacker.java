package com.lentokonepeli.network.json;

import com.google.gson.Gson;
import com.lentokonepeli.network.Networkable;

public class StringPacker {

    private GameState state = new GameState();

    public void packObjectChanges(Networkable obj) {
        var props = obj.getProps();
        var objState = new ObjectState();
        objState.type = obj.getType().ordinal();
        objState.id = obj.getId();
        for (var prop : props) {
            if (prop.isDirty()) {
                objState.data.put(prop.name, prop.get());
                prop.setClean();
            }
        }
        if (objState.data.size() > 0)
            this.state.data.add(objState);
    }

    public String getJSON() {
        Gson gson = new Gson();
        if (this.state.data.size() > 0)
            return gson.toJson(this.state);
        else
            return null;
    }

}
