import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export const Backend = isMobile ? TouchBackend : HTML5Backend; 

export const getLevel = (level, year) => {
    const currentYear = new Date().getFullYear();
    const span = currentYear - year;
    let displayLevel = level + span;

    return displayLevel.toString().padStart(2, '0');
}

export const getExp = (threshold) => {
    const normalize = m => ((m - 1 + 12) % 12) + 1;

    const month = new Date().getMonth() + 1;

    const startMonth = normalize(month);
    const endMonth = normalize(threshold);
    const currentMonth = normalize(month);

    const span = (endMonth >= startMonth)
        ? endMonth - startMonth
        : 12 - startMonth + endMonth;

    let progress = (currentMonth >= startMonth)
        ? currentMonth - startMonth
        : 12 - startMonth + currentMonth;

    return 1 - (span / 12);
}
