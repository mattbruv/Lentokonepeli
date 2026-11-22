import { ReactNode } from "react";
import classes from "./GameStage.module.css";

type GameStageProps = {
    game: ReactNode;
    side?: ReactNode;
    framed?: boolean;
};

export function GameStage({ game, side, framed = true }: GameStageProps) {
    return (
        <div className={classes.stage}>
            <div className={framed ? classes.bezel : classes.unframed}>{game}</div>
            {side && <aside className={classes.side}>{side}</aside>}
        </div>
    );
}
