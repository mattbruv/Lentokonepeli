import React, { useEffect, useState } from "react";
import { loadTextures, TextureMap } from "../client/textures";

/**
 * Ensures that PIXI textures are in memory
 */
export function TextureProvider({ children }: { children: React.ReactNode }) {
    const [textures, setTextures] = useState<TextureMap | null>(null);

    useEffect(() => {
        if (textures) return;
        loadTextures().then(setTextures);
    }, [textures]);

    if (!textures) return <div>Loading...</div>;

    return <>{children}</>;
}
