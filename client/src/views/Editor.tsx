import { useEffect, useRef, useState } from "react";
import Levels from "../assets/levels.json";
import { LevelEditor } from "../client/LevelEditor/LevelEditor";

export const Editor = () => {
    const editor = new LevelEditor();
    const [world] = useState(Levels.africa);

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        editor.init(ref.current);
    }, [ref]);

    useEffect(() => {
        if (!world) return;
        editor.render(world);
    }, [world]);

    useEffect(() => () => editor.destroy(), []);

    return <div ref={ref}></div>;
};
