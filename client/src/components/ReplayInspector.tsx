import { BuildingInspect } from "dogfight-types/BuildingInspect";
import { InspectEntity } from "dogfight-types/InspectEntity";
import { InspectOwner } from "dogfight-types/InspectOwner";
import { CSSProperties, ReactNode } from "react";
import { defineMessages, IntlShape, useIntl } from "react-intl";
import {
    ABANDONED_PLANE_COLLISION_COLOR,
    NEUTRAL_COLLISION_COLOR,
    TEAM_COLLISION_COLORS,
} from "../client/collisionColors";
import { formatName } from "../client/helpers";
import { ReplayInspection } from "../hooks/useReplay";
import classes from "./ReplayInspector.module.css";

const BULLET_LIFETIME_TICKS = 175;

const MESSAGES = defineMessages({
    Plane: { defaultMessage: "Plane", description: "Replay inspector title for a plane" },
    Man: { defaultMessage: "Pilot", description: "Replay inspector title for a pilot who bailed out" },
    Bullet: { defaultMessage: "Bullet", description: "Replay inspector title for a bullet" },
    Bomb: { defaultMessage: "Bomb", description: "Replay inspector title for a bomb" },
    Explosion: { defaultMessage: "Explosion", description: "Replay inspector title for an explosion" },
    Runway: { defaultMessage: "Runway", description: "Replay inspector title for a runway" },
    Bunker: { defaultMessage: "Headquarters", description: "Replay inspector title for a team headquarters building" },
    destroyed: { defaultMessage: "Destroyed", description: "Replay inspector badge for a destroyed building" },
    repairing: {
        defaultMessage: "Repairing",
        description: "Replay inspector row: whether a damaged building is regaining health",
    },
    facing: { defaultMessage: "Facing", description: "Replay inspector row: which way a runway faces" },
    lastReservation: {
        defaultMessage: "Last use",
        description: "Replay inspector row: whether the runway was last used for takeoff or landing",
    },
    sinceReservation: {
        defaultMessage: "Since last use",
        description: "Replay inspector row: time since the runway was last reserved for takeoff or landing",
    },
    none: { defaultMessage: "None", description: "Replay inspector value when nothing applies" },
    owner: { defaultMessage: "Owner", description: "Replay inspector row: player who owns the entity" },
    pilot: { defaultMessage: "Pilot", description: "Replay inspector row: player flying the plane" },
    noOwner: { defaultMessage: "None", description: "Replay inspector value when an entity has no owner" },
    bot: { defaultMessage: "bot", description: "Replay inspector tag shown after a bot player's name" },
    position: { defaultMessage: "Position", description: "Replay inspector row: entity world position" },
    mode: { defaultMessage: "State", description: "Replay inspector row: plane or pilot state" },
    health: { defaultMessage: "Health", description: "Replay inspector row: plane health" },
    ammo: { defaultMessage: "Ammo", description: "Replay inspector row: plane ammunition" },
    fuel: { defaultMessage: "Fuel", description: "Replay inspector row: plane fuel" },
    bombs: { defaultMessage: "Bombs", description: "Replay inspector row: bombs left on the plane" },
    motor: { defaultMessage: "Motor", description: "Replay inspector row: whether the plane motor is on" },
    flipped: {
        defaultMessage: "Flipped",
        description: "Replay inspector row: whether the plane is flipped upside down",
    },
    speed: { defaultMessage: "Speed", description: "Replay inspector row: entity speed" },
    direction: { defaultMessage: "Direction", description: "Replay inspector row: entity heading in degrees" },
    abandoned: {
        defaultMessage: "Abandoned",
        description: "Replay inspector badge for a plane whose pilot bailed out",
    },
    downedBy: { defaultMessage: "Downed by", description: "Replay inspector row: player who shot the plane down" },
    age: { defaultMessage: "Age", description: "Replay inspector row: how long the entity has existed" },
    damage: { defaultMessage: "Damage", description: "Replay inspector row: bullet damage multiplier" },
    hitEnemy: { defaultMessage: "Hit enemy", description: "Replay inspector row: whether the bullet has hit an enemy" },
    phase: { defaultMessage: "Phase", description: "Replay inspector row: explosion animation phase" },
    damaging: {
        defaultMessage: "Damaging",
        description: "Replay inspector row: whether the explosion still deals damage",
    },
    invulnerable: {
        defaultMessage: "Invulnerable",
        description: "Replay inspector row: whether a pilot who just bailed out is still immune to plane collisions",
    },
    on: { defaultMessage: "On", description: "Replay inspector value for an enabled toggle" },
    off: { defaultMessage: "Off", description: "Replay inspector value for a disabled toggle" },
    yes: { defaultMessage: "Yes", description: "Replay inspector value for true" },
    no: { defaultMessage: "No", description: "Replay inspector value for false" },
});

function entityColor(entity: InspectEntity): string {
    const { details, team } = entity;
    if (details.type === "Plane" && details.data.abandoned) return ABANDONED_PLANE_COLLISION_COLOR;
    return team ? TEAM_COLLISION_COLORS[details.type][team] : NEUTRAL_COLLISION_COLOR;
}

function isDestroyed(entity: InspectEntity): boolean {
    const { details } = entity;
    if (details.type === "Bunker") return !details.data.alive;
    if (details.type === "Runway") return !details.data.building.alive;
    return false;
}

function ownerText(intl: IntlShape, owner: InspectOwner | null): string {
    if (!owner) return intl.formatMessage(MESSAGES.noOwner);
    const name = formatName(owner.name, owner.clan);
    return owner.bot ? `${name} (${intl.formatMessage(MESSAGES.bot)})` : name;
}

function degrees(direction: number): string {
    return `${Math.round((direction * 360) / 256)}°`;
}

function yesNo(intl: IntlShape, value: boolean): string {
    return intl.formatMessage(value ? MESSAGES.yes : MESSAGES.no);
}

function buildingRows(intl: IntlShape, building: BuildingInspect): [string, ReactNode][] {
    return [
        [
            intl.formatMessage(MESSAGES.health),
            `${building.health} / ${building.max_health} (${building.health_percent}%)`,
        ],
        [intl.formatMessage(MESSAGES.repairing), yesNo(intl, building.repairing)],
    ];
}

function rows(intl: IntlShape, entity: InspectEntity): [string, ReactNode][] {
    const { details, bounding_box } = entity;
    const position: [string, ReactNode] = [
        intl.formatMessage(MESSAGES.position),
        `${bounding_box.x}, ${bounding_box.y}`,
    ];

    switch (details.type) {
        case "Plane": {
            const plane = details.data;
            return [
                [intl.formatMessage(MESSAGES.pilot), ownerText(intl, entity.owner)],
                [intl.formatMessage(MESSAGES.mode), plane.mode],
                [intl.formatMessage(MESSAGES.health), `${plane.health} (${plane.health_percent}%)`],
                [intl.formatMessage(MESSAGES.ammo), `${plane.ammo} (${plane.ammo_percent}%)`],
                [intl.formatMessage(MESSAGES.fuel), `${plane.fuel_percent}%`],
                [intl.formatMessage(MESSAGES.bombs), plane.bombs],
                [intl.formatMessage(MESSAGES.motor), intl.formatMessage(plane.motor_on ? MESSAGES.on : MESSAGES.off)],
                [intl.formatMessage(MESSAGES.flipped), yesNo(intl, plane.flipped)],
                [intl.formatMessage(MESSAGES.speed), plane.speed.toFixed(2)],
                [intl.formatMessage(MESSAGES.direction), degrees(plane.direction)],
                ...(plane.downed_by
                    ? [[intl.formatMessage(MESSAGES.downedBy), ownerText(intl, plane.downed_by)] as [string, ReactNode]]
                    : []),
                position,
            ];
        }
        case "Man":
            return [
                [intl.formatMessage(MESSAGES.owner), ownerText(intl, entity.owner)],
                [intl.formatMessage(MESSAGES.mode), details.data.state],
                [intl.formatMessage(MESSAGES.invulnerable), yesNo(intl, details.data.invulnerable)],
                position,
            ];
        case "Bullet": {
            const bullet = details.data;
            return [
                [intl.formatMessage(MESSAGES.owner), ownerText(intl, entity.owner)],
                [intl.formatMessage(MESSAGES.age), `${bullet.age} / ${BULLET_LIFETIME_TICKS}`],
                [intl.formatMessage(MESSAGES.damage), `${Math.round(bullet.damage_factor * 100)}%`],
                [intl.formatMessage(MESSAGES.hitEnemy), yesNo(intl, bullet.hit_enemy)],
                [intl.formatMessage(MESSAGES.speed), bullet.speed],
                [intl.formatMessage(MESSAGES.direction), degrees(bullet.direction)],
                position,
            ];
        }
        case "Bomb":
            return [
                [intl.formatMessage(MESSAGES.owner), ownerText(intl, entity.owner)],
                [intl.formatMessage(MESSAGES.speed), details.data.speed.toFixed(2)],
                [intl.formatMessage(MESSAGES.direction), degrees(details.data.direction)],
                position,
            ];
        case "Runway": {
            const runway = details.data;
            return [
                ...buildingRows(intl, runway.building),
                [intl.formatMessage(MESSAGES.facing), runway.facing],
                [
                    intl.formatMessage(MESSAGES.lastReservation),
                    runway.last_reservation ?? intl.formatMessage(MESSAGES.none),
                ],
                [intl.formatMessage(MESSAGES.sinceReservation), `${(runway.ms_since_reservation / 1000).toFixed(1)} s`],
                position,
            ];
        }
        case "Bunker":
            return [...buildingRows(intl, details.data), position];
        case "Explosion":
            return [
                [intl.formatMessage(MESSAGES.owner), ownerText(intl, entity.owner)],
                [intl.formatMessage(MESSAGES.phase), details.data.phase],
                [intl.formatMessage(MESSAGES.age), `${details.data.age_ms} ms`],
                [intl.formatMessage(MESSAGES.damaging), yesNo(intl, details.data.damaging)],
                position,
            ];
    }
}

export function ReplayInspector({ inspection }: { inspection: ReplayInspection | null }) {
    const intl = useIntl();
    if (!inspection) return null;

    const style: CSSProperties = {
        left: inspection.x,
        top: inspection.y,
        transform: `translate(${inspection.flipX ? "calc(-100% - 14px)" : "14px"}, ${
            inspection.flipY ? "calc(-100% - 14px)" : "14px"
        })`,
    };

    return (
        <div className={classes.inspector} style={style}>
            {inspection.entities.map((entity) => (
                <section key={`${entity.ent_type.type}-${entity.ent_type.id}`} className={classes.entity}>
                    <header className={classes.header}>
                        <span className={classes.swatch} style={{ background: entityColor(entity) }} />
                        <span className={classes.title}>{intl.formatMessage(MESSAGES[entity.details.type])}</span>
                        {entity.details.type === "Plane" && (
                            <span className={classes.subtitle}>{entity.details.data.plane_type}</span>
                        )}
                        {isDestroyed(entity) && (
                            <span className={classes.badge}>{intl.formatMessage(MESSAGES.destroyed)}</span>
                        )}
                        {entity.details.type === "Plane" && entity.details.data.abandoned && (
                            <span className={classes.badge}>{intl.formatMessage(MESSAGES.abandoned)}</span>
                        )}
                    </header>
                    <dl className={classes.rows}>
                        {rows(intl, entity).map(([label, value]) => (
                            <div key={label} className={classes.row}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ))}
        </div>
    );
}
