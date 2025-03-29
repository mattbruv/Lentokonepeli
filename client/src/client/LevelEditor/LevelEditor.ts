import { EntityProperties } from "dogfight-types/EntityProperties";
import { ServerOutput } from "dogfight-types/ServerOutput";
import { DogfightWeb } from "dogfight-web";
import * as PIXI from "pixi.js";
import { updateProps } from "../entities/entity";
import { DEFAULT_ENTITIES, destroyEntities, entityCollection } from "../EntityManager";
import { RenderClient } from "../RenderClient";
import { Textures } from "../textures";

export class LevelEditor {
    renderClient: RenderClient;
    background = new PIXI.TilingSprite(Textures["sky3b.jpg"]);
    engine = DogfightWeb.new();
    entities = entityCollection(DEFAULT_ENTITIES);

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
    }
    public init(element: HTMLDivElement) {
        element?.appendChild(this.renderClient.app.view);
        this.renderClient.centerCamera(0, 0);
    }

    public render(world: string) {
        destroyEntities(this.entities);
        this.engine.load_level(world);
        const events_json = this.engine.game_events_from_binary(this.engine.flush_changed_state());
        const events: ServerOutput[] = JSON.parse(events_json);
        for (const event of events) {
            if (event.type === "EntityChanges") {
                const changes = event.data;
                for (const change of changes) {
                    const { id, update } = change;

                    switch (update.type) {
                        case "Properties": {
                            this.updateEntity(id, update.data);
                        }
                    }
                }
            }
        }
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

    private updateEntity(id: number, data: EntityProperties) {
        if (data.type === "Player") return;
        const entity = this.addOrGetEntity(id, data.type);
        updateProps(entity, data.props);
    }
    public destroy() {
        destroyEntities(this.entities);

        this.renderClient.app.destroy(true, {
            children: true,
        });
    }
}
