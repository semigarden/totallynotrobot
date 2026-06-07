import { useMemo, useState } from "react";
import PretextTextVoices from "@/components/effect/PretextTextVoices";
import {
    loadUserLines,
    saveUserLine,
    buildGardenDialogue,
} from "@/api/manifestoGarden";
import {
    MANIFESTO_OPENING,
    APP_ACKNOWLEDGMENTS,
    buildConversationModel,
} from "@/data/manifestoConversation";
import manifestoStyles from "@/styles/Manifesto.module.scss";

const ManifestoGarden = () => {
    const [userLines, setUserLines] = useState(loadUserLines);
    const [draft, setDraft] = useState("");

    const dialogue = useMemo(
        () => buildGardenDialogue(MANIFESTO_OPENING, userLines, APP_ACKNOWLEDGMENTS),
        [userLines]
    );

    const manifesto = useMemo(
        () => buildConversationModel(dialogue),
        [dialogue]
    );

    const submitLine = (event) => {
        event.preventDefault();
        const next = saveUserLine(draft);
        setUserLines(next);
        setDraft("");
    };

    return (
        <>
            <PretextTextVoices
                text={manifesto.text}
                wordMeta={manifesto.wordMeta}
                className={manifestoStyles.manifestoText}
            />

            <form className={manifestoStyles.replyForm} onSubmit={submitLine}>
                <label className={manifestoStyles.replyLabel} htmlFor="garden-reply">
                    you
                </label>
                <input
                    id="garden-reply"
                    className={manifestoStyles.replyInput}
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="leave a line · it grows in garden"
                    maxLength={160}
                    autoComplete="off"
                />
            </form>
        </>
    );
};

export default ManifestoGarden;
