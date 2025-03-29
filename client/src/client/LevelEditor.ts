import { EntityProperties } from "dogfight-types/EntityProperties";
import { EntityType } from "dogfight-types/EntityType";
import { MapPiece as MapPieceType } from "dogfight-types/MapPiece";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { DogfightWeb } from "dogfight-web";
import * as PIXI from "pixi.js";
import Levels from "../assets/levels.json";
import { DogfightSettings } from "../contexts/settingsContext";
import { updateProps } from "./entities/entity";
import { DEFAULT_ENTITIES, entityCollection } from "./EntityManager";
import { RenderClient } from "./RenderClient";
import { Textures } from "./textures";

export const MapPiece = {
    Air: ".",
    GroundNormal: "#",
    GroundDesert: "_",
    WaterNormalLeft: "/",
    WaterNormalRight: "\\",
    WaterDesertLeft: "(",
    WaterDesertRight: ")",
    HillNormal: "H",
    HillDesert: "S",
    CoastNormalRight: ">",
    CoastNormalLeft: "<",
    CoastDesertLeft: "[",
    CoastDesertRight: "]",
    RunwayCentralsLeft: "L",
    RunwayCentralsRight: "R",
    RunwayAlliesLeft: "l",
    RunwayAlliesRight: "r",
    PalmTreeLeft: "p",
    PalmTreeRight: "P",
    ControlTowerLeft: "t",
    ControlTowerRight: "T",
    DesertTowerLeft: "d",
    DesertTowerRight: "D",
    FlagAllies: "f",
    FlagCentrals: "F",
    BunkerCentrals: "I",
    BunkerAllies: "i",
} as const satisfies Record<MapPieceType, string>;
export type MapPiece = (typeof MapPiece)[keyof typeof MapPiece];

export const KNOWN_MAP_PIECES = Object.values(MapPiece);

export class LevelEditor {
    renderClient: RenderClient;
    background = new PIXI.TilingSprite(Textures["sky3b.jpg"]);
    entities = entityCollection(DEFAULT_ENTITIES);
    engine = DogfightWeb.new();

    constructor() {
        const backgroundTexture = Textures["sky3b.jpg"];
        this.background.texture = backgroundTexture;
        this.background.width = backgroundTexture.width;
        this.background.height = backgroundTexture.height;
        this.background.position.set(0, -250);
        this.renderClient = new RenderClient({
            background: this.background,
            containers: [],
            enableMouseDragging: true,
            hud: null,
        });
        this.renderClient.centerCamera(0, 0);
    }

    public render(world: string) {
        this.destroyEntities();
        this.engine.load_level(world);
        const events: ServerOutput[] = JSON.parse(
            this.engine.game_events_from_binary(this.engine.flush_changed_state()),
        );
        for (const { type, data } of events) {
            if (type !== "EntityChanges") continue;
            for (const { id, update, ent_type } of data) {
                switch (update.type) {
                    case "Properties": {
                        this.upsertEntity(id, update.data);
                        break;
                    }
                    case "Deleted": {
                        this.deleteEntity(id, ent_type);
                        break;
                    }
                }
            }
        }
    }

    public init(element: HTMLDivElement) {
        element?.appendChild(this.renderClient.app.view);
        this.engine.init();
    }

    private addOrGetEntity(id: number, type: keyof typeof this.entities) {
        const ent_map = this.entities[type];
        const ent = ent_map.collection.get(id);
        if (ent) return ent;
        const newEnt = ent_map.new_type();
        // @ts-expect-error ts mumbo jumbo
        ent_map.collection.set(id, newEnt);
        const container = newEnt.getContainer();
        const containers = Array.isArray(container) ? container : [container];
        this.renderClient.viewport.addChild(...containers);
        return newEnt;
    }

    private upsertEntity(id: number, data: EntityProperties) {
        if (data.type === "Player") return;
        const entity = this.addOrGetEntity(id, data.type);
        updateProps(entity, data.props);
    }

    private deleteEntity(id: number, ent_type: EntityType) {
        const ent_map = this.entities[ent_type as keyof typeof this.entities];
        if (!ent_map) return;
        const entity = ent_map.collection.get(id);
        if (!entity) return;
        const container = entity.getContainer();
        const containers = Array.isArray(container) ? container : [container];
        this.renderClient.viewport.removeChild(...containers);
        entity.destroy();
        ent_map.collection.delete(id);
    }

    private destroyEntities() {
        for (const group of Object.values(this.entities)) {
            for (const [id, entity] of group.collection.entries()) {
                const container = entity.getContainer();
                const containers = Array.isArray(container) ? container : [container];
                this.renderClient.viewport.removeChild(...containers);
                entity.destroy();
                group.collection.delete(id);
            }
        }
    }

    public destroy() {
        this.destroyEntities();
        this.renderClient.app.destroy(true, {
            children: true,
        });
    }

    static sanitizeWorldString(world: string): string {
        return world
            .split("\n")
            .map((line) => {
                if (!line.startsWith("layer")) return line.trim();
                const [identifier, pieces] = line.split("=");
                const validatedPieces = pieces
                    .split("")
                    .filter((char) => KNOWN_MAP_PIECES.includes(char as MapPiece))
                    .join("");
                return identifier.trim() + "=" + validatedPieces.trim();
            })
            .join("\n");
    }

    static initialWorldString(settings: DogfightSettings) {
        return "your_level\n".concat(
            Levels.classic
                .split("\n")
                .slice(1, -1)
                .concat(`designer=${settings.username || "guest"}`)
                .join("\n"),
        );
    }

    static worldDownloadFileName(world: string) {
        const lines = world.split("\n");
        const name = lines[0].trim();
        const author = lines.at(-1)?.split("=")?.[1] || "guest";
        return `${author}-${name}.txt`;
    }
}
