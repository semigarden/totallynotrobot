import styles from "@/styles/hud/LightHud.module.scss";

const Sun = ({ className = "", active = true }) => (
    <div
        className={`${styles.sun} ${active ? styles.active : styles.inactive} ${className}`}
        aria-hidden="true"
    >
        <div className={styles.line0} />
        <div className={styles.rays}>
            <div className={styles.line1} />
            <div className={styles.line2} />
            <div className={styles.line3} />
            <div className={styles.line4} />
            <div className={styles.line6} />
            <div className={styles.line7} />
            <div className={styles.line8} />
            <div className={styles.line9} />
        </div>
        <div className={styles.line5} />
        <span className={styles.themeLabel}>Light</span>
    </div>
);

export default Sun;
