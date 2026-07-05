import styles from "@/styles/hud/LightHud.module.scss";

const Moon = ({ className = "", active = false }) => (
    <div
        className={`${styles.moon} ${active ? styles.active : styles.inactive} ${className}`}
        aria-hidden="true"
    >
        <div className={styles.line0} />
        <div className={styles.line5} />
        <span className={styles.themeLabel}>Dark</span>
    </div>
);

export default Moon;
