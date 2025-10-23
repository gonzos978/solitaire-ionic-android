import { useEffect, useRef } from "react";

export default function HaxeGame() {
    const containerRef = useRef(null);

    useEffect(() => {
        // @ts-ignore
        if (window.solitaireLoaded) return;

        const script = document.createElement("script");
        script.src = "/game/SolitaireGame.js";
        script.async = true;

        script.onload = () => {
            // @ts-ignore
            if (window.lime && containerRef.current) {
                // OpenFL canvas will fill container
                // @ts-ignore
                lime.embed("SolitaireGame", containerRef.current.id, containerRef.current.clientWidth, containerRef.current.clientHeight, { parameters: {} });
                // @ts-ignore
                window.solitaireLoaded = true;
                // @ts-ignore
                console.log("Solitaire loaded", containerRef.current.id);
            } else {
                console.error("Lime not loaded!");
            }
        };

        document.body.appendChild(script); // append to body, not container

        return () => {
            // @ts-ignore
            if (!window.solitaireLoaded) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            id="openfl-container"
            style={{
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "#000",
            }}
        />
    );
}
