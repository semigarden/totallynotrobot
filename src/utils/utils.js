import data from "../api/data";

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
