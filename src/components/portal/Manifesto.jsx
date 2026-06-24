import { useState } from "react";
import ManifestoGarden from "@/components/portal/ManifestoGarden";
import ManifestoWake from "@/components/portal/ManifestoWake";
import manifestoStyles from "@/styles/Manifesto.module.scss";

const Manifesto = () => {
    const [mode, setMode] = useState("wake");

    return (
        <div className={manifestoStyles.manifesto}>
            <div className={manifestoStyles.manifestoContent}>
                {/* <div className={manifestoStyles.modeSwitch}>
                    <button
                        type="button"
                        className={`${manifestoStyles.modeButton} ${
                            mode === "garden" ? manifestoStyles.modeButtonActive : ""
                        }`}
                        onClick={() => setMode("garden")}
                    >
                        garden
                    </button>
                    <button
                        type="button"
                        className={`${manifestoStyles.modeButton} ${
                            mode === "wake" ? manifestoStyles.modeButtonActive : ""
                        }`}
                        onClick={() => setMode("wake")}
                    >
                        wake
                    </button>
                </div> */}

                {mode === "garden" ? <ManifestoGarden /> : <ManifestoWake />}
            </div>
        </div>
    );
};

export default Manifesto;
