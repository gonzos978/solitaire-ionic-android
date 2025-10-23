import {useEffect, useRef, useState} from "react";
import {hideBanner, initAdMob, showBanner, showRewarded} from "../admob";
import {
    addCoins,
    buyHints, claimDailyReward,
    getPlayerData,
    incrementPlayCount,
    spendCardAsync,
    spendCoins, spendHint
} from "../services/GameService";
import DebugInfo from "../DebugInfo";
import {eventBus} from "../events/EventBus";
import { Network } from '@capacitor/network';

export default function GamePage() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [debugInfo, setDebugInfo] = useState("TEST");

    let iframe:any = null;
    const onlineStatus = async () => {
        try {
            const status = await Network.getStatus();

            // Update debug overlay
            setDebugInfo(`Network: ${status.connected ? "ONLINE" : "OFFLINE"}\nType: ${status.connectionType}`);

            // Emit event via EventBus
            eventBus.emit("NETWORK_STATUS", status);

            // Send message to iframe
            iframeRef.current?.contentWindow?.postMessage(
                {
                    type: "NETWORK_STATUS",
                    payload: { status }, // pass the object directly
                },
                "*" // replace with iframe origin in production
            );

            return status;
        } catch (err) {
            console.error("Error checking network status:", err);
            return { connected: false, connectionType: "unknown" };
        }
    };

    useEffect(() => {
        // Listen for messages from the game iframe
        function handleMessage(event: MessageEvent) {
            // Make sure message is from your game origin (optional)
            if (!event.origin.includes(window.location.origin)) return;

            iframe = document.getElementById("game-iframe") as HTMLIFrameElement;
            const { type, payload } = event.data || {};
            console.log("Message from game:", type, payload);


            switch (type) {

                case "CHECK_NETWORK":

                   onlineStatus()




                    break;
                case "INIT_ADD_MOB":
                    initAdMob();
                    break;

                case "SHOW_BANNER":
                    // handle coins
                    console.log("Coins:", payload.coins);
                    showBanner("ca-app-pub-9275591324607728/2665895664");
                    break;
                case "HIDE_BANNER":
                    hideBanner();
                    break;
                case "SHOW_REWARD_VIDEO":
                    showRewarded("ca-app-pub-9275591324607728/2624774895", (reward) => {

                        console.log("🎁 Reward callback received:", reward);
                        //eventBus.emit("FOO", reward)
                        // Send message to the game (if it's in an iframe)

                        iframe.contentWindow?.postMessage(
                            { type: "VIDEO_REWARD_GRANTED", payload: { result:reward, status: "OK" } },
                            "*" // replace with iframe origin in prod
                        );
                    });
                    break;
                case "GET_INITIAL_DATA":

                    getPlayerData()
                        .then(result => {

                            if (result) {
                                console.log('success', result);
                                iframe.contentWindow?.postMessage(
                                    { type: "INITIAL_DATA", payload: { result, status: "OK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            } else {
                                iframe.contentWindow?.postMessage(
                                    { type: "INITIAL_DATA", payload: { result, status: "NOK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            }
                        });

                  break;

                case "BUY_CARD":
                    spendCoins(payload.coins).then(result => {

                        if (result.success) {
                            console.log('success', result.coins);
                            iframe.contentWindow?.postMessage(
                                { type: "CARD_BUOYED", payload: { result, status: "OK" } },
                                "*" // replace with iframe origin in prod
                            );
                        } else {
                            console.log('failure', result?.coins);
                            iframe.contentWindow?.postMessage(
                                { type: "CARD_BUOYED", payload: { result, status: "NOK" } },
                                "*" // replace with iframe origin in prod
                            );
                        }
                    });

                    break;

                case "BUY_HINTS":

                    buyHints(payload.coins)
                        .then(result => {
                            if (result.success) {
                                console.log('success', result);
                                iframe.contentWindow?.postMessage(
                                    { type: "HINTS_BUOYED", payload: { result, status: "OK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            } else {
                                console.log('failure', result);
                                iframe.contentWindow?.postMessage(
                                    { type: "HINTS_BUOYED", payload: { result, status: "NOK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            }
                        })
                        .catch(error => {
                            console.log({success: false, hints: 0});
                        });
                    break;

                case "SPEND_CARD":

                    spendCardAsync()
                        .then(result => {
                            console.log('success', result);
                            iframe.contentWindow?.postMessage(
                                { type: "CARD_SPENDED", payload: { result, status: "OK" } },
                                "*" // replace with iframe origin in prod
                            );
                        })
                        .catch(error => {
                            console.log({success: false, cards: 0});
                            iframe.contentWindow?.postMessage(
                                { type: "CARD_SPENDED", payload: { result:{}, status: "NOK" } },
                                "*" // replace with iframe origin in prod
                            );
                        });

                    break;

                case "FINISH_GAME":

                    incrementPlayCount()
                        .then(result => {
                            if (result.success) {
                                console.log('success', result);
                                iframe.contentWindow?.postMessage(
                                    { type: "GAME_END", payload: { result, status: "OK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            } else {
                                console.log('failure', result);
                                iframe.contentWindow?.postMessage(
                                    { type: "GAME_END", payload: { result, status: "NOK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            }

                        })
                        .catch(error => {

                            console.log({success: false, playCount: 0});
                        });

                    break;

                case "WIN_COINS":

                    addCoins(payload.coins).then(result => {
                        if (result?.success) {
                            console.log('success', result.success);
                            iframe.contentWindow?.postMessage(
                                { type: "WIN_COINS", payload: { result, status: "OK" } },
                                "*" // replace with iframe origin in prod
                            );
                        } else {
                            console.log('failure', result);
                            iframe.contentWindow?.postMessage(
                                { type: "WIN_COINS", payload: { result, status: "NOK" } },
                                "*" // replace with iframe origin in prod
                            );
                        }

                    });

                    break;

                case "SPEND_HINTS":
                    spendHint()
                        .then(result => {
                            if (result.success) {
                                console.log('success', result);
                                iframe.contentWindow?.postMessage(
                                    { type: "HINTS_SPENDED", payload: { result, status: "OK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            } else {
                                console.log('failure', result);
                                iframe.contentWindow?.postMessage(
                                    { type: "HINTS_SPENDED", payload: { result, status: "NOK" } },
                                    "*" // replace with iframe origin in prod
                                );
                            }
                        })
                        .catch(error => {

                            console.log({success: false, hints: 0});
                        });

                    break;

                case "CHECK_REWARD":

                    claimDailyReward().then(result => {
                        if (result.claimed) {
                            //const playerLevel = getPlayerLevelFromFirebase();
                            //console.log('OK', result);
                            iframe.contentWindow?.postMessage(
                                { type: "REWARD_CHECKED", payload: { result, status: "OK" } },
                                "*" // replace with iframe origin in prod
                            );

                        } else {
                            console.log('NOK');
                            iframe.contentWindow?.postMessage(
                                { type: "REWARD_CHECKED", payload: { result, status: "NOK" } },
                                "*" // replace with iframe origin in prod
                            );
                        }
                    });

                    break;


                default:
                    break;
            }
        }

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    // Send message to iframe
    const sendMessageToGame = (type: string, payload?: any) => {
        iframeRef.current?.contentWindow?.postMessage({ type, payload }, "*");
    };
    const isDebug = false;


    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <iframe
                id="game-iframe"
                ref={iframeRef}
                src="/game/index.html"
                style={{ width: "100%", height: "100%", border: "none" }}
            />
            <button onClick={() => sendMessageToGame("ADD_COINS", { amount: 100 })}>
                Add 100 Coins
            </button>
            {isDebug && <DebugInfo info={debugInfo} />}
        </div>
    );
}
