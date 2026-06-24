import { useState } from "react";
import ManifestoGarden from "@/components/portal/ManifestoGarden";
import ManifestoWake from "@/components/portal/ManifestoWake";
import manifestoStyles from "@/styles/Manifesto.module.scss";

const Manifesto = () => {
    const [mode, setMode] = useState("wake");

    return (
        <div className={manifestoStyles.manifesto}>
            <div className={manifestoStyles.manifestoContent}>
                {mode === "garden" ? <ManifestoGarden /> : <ManifestoWake />}
            </div>
        </div>
    );
};

export default Manifesto;
