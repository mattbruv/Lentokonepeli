import { ReactNode, useRef } from "react";
import { GameSizeControl } from "./GameSizeControl";
import classes from "./GameStage.module.css";

type GameStageProps = {
    game: ReactNode;
    side?: ReactNode;
    framed?: boolean;
};

export function GameStage({ game, side, framed = true }: GameStageProps) {
    const bezel = useRef<HTMLDivElement>(null);

    return (
        <div className={classes.stage}>
            <div ref={bezel} className={framed ? classes.bezel : classes.unframed}>
                {game}
            </div>
            {(side || framed) && (
                <aside className={classes.side}>
                    {side}
                    {framed && <GameSizeControl stage={bezel} />}
                </aside>
            )}
        </div>
    );
}
