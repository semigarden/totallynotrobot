import styles from "@/styles/hud/ListHud.module.scss";

const ListHud = () => {
    return (
        <div className={styles.listHud}>
            <div className={styles.side}>
                <div className={styles.title}>
                    <div className={styles.text0}>
                        PROJECTS
                    </div>
                    <div className={styles.text1}>
                        // INDEX
                    </div>
                </div>
                <div className={`${styles.circle} ${styles.circle0}`}>
                    <div className={styles.circleInner} />
                </div>
                <div className={`${styles.circle} ${styles.circle1}`}>
                    {/* <div className={styles.circleInner} /> */}
                </div>
                <div className={`${styles.circle} ${styles.circle2}`}>
                    {/* <div className={styles.circleInner} /> */}
                </div>
                <div className={`${styles.circle} ${styles.circle3}`}>
                    {/* <div className={styles.circleInner} /> */}
                </div>
                <div className={styles.line0} />
                <div className={styles.line1} />
                <div className={styles.line2} />
                <div className={styles.line3} />
                <div className={styles.line4} />
                <div className={styles.line5} />
                <div className={styles.line6} />
                <div className={styles.line7} />
            </div>
        </div>
    );
};

export default ListHud;
