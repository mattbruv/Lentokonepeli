package com.lentokonepeli.map;

import java.io.Reader;
import java.util.Arrays;

import com.google.gson.Gson;
import com.lentokonepeli.Direction;
import com.lentokonepeli.GameToolkit;
import com.lentokonepeli.Team;
import com.lentokonepeli.TerrainType;
import com.lentokonepeli.entities.Bunker;
import com.lentokonepeli.entities.Coast;
import com.lentokonepeli.entities.Flag;
import com.lentokonepeli.entities.Ground;
import com.lentokonepeli.entities.Hill;
import com.lentokonepeli.entities.Palm;
import com.lentokonepeli.entities.Runway;
import com.lentokonepeli.entities.Tower;
import com.lentokonepeli.entities.Water;
import com.lentokonepeli.map.json.MapJSON;

import java.io.FileReader;
import java.io.IOException;

public class MapLoader {

    public static void loadMapFromFile(String path, GameToolkit toolkit) {

        try {
            Reader reader = new FileReader(path);
            Gson gson = new Gson();
            MapJSON mapObj = gson.fromJson(reader, MapJSON.class);
            loadMap(mapObj, toolkit);
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    private static void loadMap(MapJSON map, GameToolkit toolkit) {
        System.out.println("Loading map: " + map.name);

        if (map.entities == null) {
            System.out.println("No map data!");
            return;
        }

        if (map.entities.ground != null) {
            for (var g : map.entities.ground) {
                var ground = new Ground(g.x, g.y, g.width, stringToTerrain(g.type));
                toolkit.addEntity(ground);
            }
        }

        if (map.entities.water != null) {
            for (var w : map.entities.water) {
                var t = stringToTerrain(w.type);
                var d = stringToDirection(w.direction);
                var water = new Water(w.x, w.y, w.width, t, d);
                toolkit.addEntity(water);
            }
        }

        if (map.entities.coast != null) {
            for (var c : map.entities.coast) {
                var t = stringToTerrain(c.type);
                var d = (c.direction.equals("left")) ? Direction.LEFT : Direction.RIGHT;
                var coast = new Coast(c.x, c.y, t, d);
                toolkit.addEntity(coast);
            }
        }

        if (map.entities.runway != null) {
            for (var r : map.entities.runway) {
                var t = stringToTeam(r.team);
                var d = stringToDirection(r.direction);
                var runway = new Runway(r.x, r.y, t, d);
                toolkit.addEntity(runway);
            }
        }

        if (map.entities.bunker != null) {
            for (var b : map.entities.bunker) {
                var t = stringToTeam(b.team);
                var bunker = new Bunker(b.x, b.y, t);
                toolkit.addEntity(bunker);
            }
        }

        if (map.entities.tower != null) {
            for (var t : map.entities.tower) {
                var type = stringToTerrain(t.type);
                var d = stringToDirection(t.direction);
                var tower = new Tower(t.x, t.y, type, d);
                toolkit.addEntity(tower);
            }
        }

        if (map.entities.flag != null) {
            for (var f : map.entities.flag) {
                var t = stringToTeam(f.team);
                var flag = new Flag(f.x, f.y, t);
                toolkit.addEntity(flag);
            }
        }

        if (map.entities.hill != null) {
            for (var h : map.entities.hill) {
                var t = stringToTerrain(h.type);
                var hill = new Hill(h.x, h.y, t);
                toolkit.addEntity(hill);
            }
        }

        if (map.entities.palm != null) {
            for (var p : map.entities.palm) {
                var d = stringToDirection(p.direction);
                var palm = new Palm(p.x, p.y, d);
                toolkit.addEntity(palm);
            }
        }
    }

    private static TerrainType stringToTerrain(String terrain) {
        switch (terrain) {
        case "desert":
            return TerrainType.DESERT;
        default:
            return TerrainType.NORMAL;
        }
    }

    private static Direction stringToDirection(String dir) {
        switch (dir) {
        case "left":
            return Direction.LEFT;
        default:
            return Direction.RIGHT;
        }
    }

    private static Team stringToTeam(String team) {
        switch (team) {
        case "allies":
            return Team.ALLIES;
        default:
            return Team.CENTRALS;
        }
    }
}
