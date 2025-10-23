import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import GamePage from "./pages/Game"

/* Ionic CSS */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

const App = () => (

    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <Route path="/game" render={() => <GamePage />} exact />
                <Redirect from="/" to="/game" exact />
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
