// import feedAtom from "@/feed.atom?raw";
import { MAX_ITEMS_PER_GARDEN } from "@/data/webGardens";

const DATE_TITLE_PATTERN =
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})(\s+update)?$/i;

const stripHtml = (value = "") =>
    value
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const parseTimestamp = (value) => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const plantTextFromItem = (title, description) => {
    const cleanTitle = stripHtml(title);
    const cleanDescription = stripHtml(description);

    if (DATE_TITLE_PATTERN.test(cleanTitle) && cleanDescription) {
        const withoutDate = cleanDescription
            .replace(/^[\d./\-\s]+(\s*-\s*|\s+update\s*-\s*)/i, "")
            .trim();

        return (withoutDate || cleanDescription || cleanTitle).slice(0, 160);
    }

    return cleanTitle.slice(0, 160);
};

const normalizeItem = (item) => {
    const title = stripHtml(item.title);
    if (!title) return null;

    const description = stripHtml(item.description);

    return {
        id: item.id,
        title: title.slice(0, 160),
        blogTitle: title.slice(0, 160),
        text: plantTextFromItem(title, description),
        description: description.slice(0, 240) || null,
        link: item.link || null,
        pubDate: item.pubDate || null,
    };
};

const sortByPubDate = (items) =>
    [...items].sort(
        (left, right) => parseTimestamp(right.pubDate) - parseTimestamp(left.pubDate)
    );

export const prepareFeedItems = (rawItems = []) =>
    sortByPubDate(rawItems.map(normalizeItem).filter(Boolean)).slice(
        0,
        MAX_ITEMS_PER_GARDEN
    );

const slugifySubreddit = (name = "reddit") =>
    name.trim().toLowerCase().replace(/\s+/g, "-");

const parseAtomEntries = (xml) => {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) return [];

    return [...doc.querySelectorAll("entry")].map((node) => ({
        id:
            node.querySelector("id")?.textContent?.trim() ||
            node.querySelector("link")?.getAttribute("href"),
        title: node.querySelector("title")?.textContent,
        description: node.querySelector("summary, content")?.textContent,
        link: node.querySelector("link")?.getAttribute("href"),
        pubDate: node.querySelector("published, updated")?.textContent,
        category:
            node.querySelector("category")?.getAttribute("term")?.trim() ||
            "reddit",
    }));
};

const gardenFromSubreddit = (subreddit) => {
    const slug = slugifySubreddit(subreddit);

    return {
        id: slug,
        name: `r/${subreddit}`,
        feedUrl: `https://www.reddit.com/r/${subreddit}/.rss`,
        homepage: `https://www.reddit.com/r/${subreddit}/`,
        description: `Posts from r/${subreddit}`,
    };
};

export const buildGardensFromLocalFeed = (xml = "") => {
    const entries = parseAtomEntries(xml);
    const bySubreddit = new Map();

    entries.forEach((entry) => {
        const subreddit = entry.category || "reddit";
        const bucket = bySubreddit.get(subreddit) ?? [];
        bucket.push(entry);
        bySubreddit.set(subreddit, bucket);
    });

    const gardens = [];
    const feedResults = {};

    [...bySubreddit.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .forEach(([subreddit, rawItems]) => {
            const garden = gardenFromSubreddit(subreddit);
            const items = prepareFeedItems(rawItems);

            gardens.push(garden);
            feedResults[garden.id] = {
                gardenId: garden.id,
                source: "local",
                items,
                totalAvailable: rawItems.length,
                syncedAt: Date.now(),
            };
        });

    return { gardens, feedResults };
};

export const fetchAllGardenFeeds = async () => {
    const { feedResults } = buildGardensFromLocalFeed();
    return feedResults;
};
