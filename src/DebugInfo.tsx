import React, {useEffect, useState} from "react";
import {eventBus} from "./events/EventBus";

interface DebugInfoProps {
    infoM: string;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ infoM }) => {
    const [info, setInfo] = useState("Debug Info Ready...");

    useEffect(() => {
        const handler = (message: any) => {

            const str = JSON.stringify(message);
            setInfo(str);
        };

        eventBus.on("FOO", handler);

        return () => {
            eventBus.off("FOO", handler);
        };
    }, []);



    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "10%",
                color: "#0f0",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                fontSize: "12px",
                padding: "4px 8px",
                zIndex: 9999,
                whiteSpace: "pre-line",
                fontFamily: "sans-serif",
            }}
        >
            {info}
        </div>
    );
};

export default DebugInfo;
