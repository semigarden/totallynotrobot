import { useState } from "react";
import Plant from "@/components/garden/Plant";
import styles from "@/styles/VirtualGarden.module.scss";

const VirtualGarden = ({ plants = [] }) => {
    const [activeId, setActiveId] = useState(null);

    return (
        <section className={styles.garden} aria-label="virtual garden">
            <div className={styles.gardenHeader}>
                <span className={styles.gardenLabel}>virtual garden</span>
                <span className={styles.gardenCount}>
                    {plants.length} {plants.length === 1 ? "plant" : "plants"}
                </span>
            </div>

            <div className={styles.gardenBed}>
                <div className={styles.soilLine} />

                {plants.length === 0 ? (
                    <p className={styles.gardenEmpty}>
                        Lines you plant below grow here as generated flora.
                    </p>
                ) : (
                    <div
                        className={styles.gardenGrid}
                        style={{
                            gridTemplateColumns: `repeat(${Math.max(
                                2,
                                Math.ceil(Math.sqrt(plants.length))
                            )}, minmax(88px, 1fr))`,
                        }}
                    >
                        {plants.map((plant) => (
                            <div
                                key={plant.id}
                                className={styles.gardenCell}
                                onMouseEnter={() => setActiveId(plant.id)}
                                onMouseLeave={() => setActiveId(null)}
                                onFocus={() => setActiveId(plant.id)}
                                onBlur={() => setActiveId(null)}
                            >
                                <Plant
                                    text={plant.text}
                                    seed={plant.id}
                                    label={plant.text}
                                    active={activeId === plant.id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default VirtualGarden;
