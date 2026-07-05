export const endsWithPunctuation = (word) =>
    /[,.;:!?)\]·/&](?=\s*$)/.test(word);

export const fillerLineGap = (words, innerWidth, lineWidth, punctuationGap) => {
    const gapCount = Math.max(0, words.length - 1);
    if (!innerWidth || !gapCount) return 0;

    let punctExtra = 0;
    for (let i = 0; i < words.length - 1; i += 1) {
        if (endsWithPunctuation(words[i])) punctExtra += punctuationGap;
    }

    return Math.max(0, innerWidth - lineWidth - punctExtra) / gapCount;
};

export const pretextContentWidth = (containerWidth, horizontalPadding) =>
    Math.max(0, containerWidth - horizontalPadding);
