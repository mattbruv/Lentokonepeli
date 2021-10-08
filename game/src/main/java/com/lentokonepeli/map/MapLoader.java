package com.lentokonepeli.map;

import java.io.Reader;

import com.google.gson.Gson;
import com.lentokonepeli.Direction;
import com.lentokonepeli.GameToolkit;
import com.lentokonepeli.Team;
import com.lentokonepeli.TerrainType;
import com.lentokonepeli.entities.Ground;
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
