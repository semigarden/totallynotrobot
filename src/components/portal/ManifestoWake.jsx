import PretextTextWake from "@/components/effect/PretextTextWake";
import {
    MANIFESTO_LAYERS,
    MANIFESTO_SEGMENTS,
    buildWakeModel,
} from "@/data/manifestoWake";
import manifestoStyles from "@/styles/Manifesto.module.scss";

const manifesto = buildWakeModel(MANIFESTO_SEGMENTS, MANIFESTO_LAYERS);

const ManifestoWake = () => (
    <PretextTextWake
        text={manifesto.text}
        wordMeta={manifesto.wordMeta}
        echoLayers={manifesto.echoLayers}
        className={manifestoStyles.manifestoText}
    />
);

export default ManifestoWake;
