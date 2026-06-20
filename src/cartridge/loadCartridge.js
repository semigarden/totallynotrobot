import {
    decodeManifestFile,
    extractCartridge,
} from "@/cartridge/cartridgeFormat";

const textDecoder = new TextDecoder();
const retainedRuntimes = new Set();

const normalizeAssetPath = (value) => value.replace(/^\.\//, "");

const resolveAssetUrl = (rawPath, urlByPath) => {
    if (!rawPath) return null;
    if (/^(?:[a-z]+:|\/\/|#)/i.test(rawPath)) return null;

    const normalized = normalizeAssetPath(rawPath);
    return urlByPath.get(normalized) ?? urlByPath.get(rawPath) ?? null;
};

const buildLaunchDocument = (html, urlByPath) => {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc.querySelectorAll("script[src], link[href]").forEach((element) => {
        const attribute = element.hasAttribute("src") ? "src" : "href";
        const rawPath = element.getAttribute(attribute);
        const assetUrl = resolveAssetUrl(rawPath, urlByPath);

        if (assetUrl) {
            element.setAttribute(attribute, assetUrl);
        }

        element.removeAttribute("crossorigin");
    });

    doc.documentElement.querySelectorAll("[crossorigin]").forEach((element) => {
        element.removeAttribute("crossorigin");
    });

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
};

const guessMimeType = (filePath) => {
    if (filePath.endsWith(".html")) return "text/html";
    if (filePath.endsWith(".css")) return "text/css";
    if (filePath.endsWith(".js")) return "text/javascript";
    if (filePath.endsWith(".svg")) return "image/svg+xml";
    if (filePath.endsWith(".png")) return "image/png";
    if (filePath.endsWith(".json")) return "application/json";
    return "application/octet-stream";
};

export const createCartridgeFromFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const { png, manifest } = await extractCartridge(new Uint8Array(buffer));
    const blobUrls = [];
    const urlByPath = new Map();

    Object.entries(manifest.files ?? {}).forEach(([filePath, record]) => {
        const bytes = decodeManifestFile(record);
        const mime = record.mime ?? guessMimeType(filePath);
        const blob = new Blob([bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        blobUrls.push(url);
        urlByPath.set(filePath, url);
        urlByPath.set(normalizeAssetPath(filePath), url);
    });

    const coverBlob = new Blob([png], { type: "image/png" });
    const coverUrl = URL.createObjectURL(coverBlob);
    blobUrls.push(coverUrl);

    const entryRecord = manifest.files?.[manifest.entry];
    if (!entryRecord) {
        blobUrls.forEach((url) => URL.revokeObjectURL(url));
        throw new Error(`Manifest entry not found: ${manifest.entry}`);
    }

    const htmlBytes = decodeManifestFile(entryRecord);
    const html = textDecoder.decode(htmlBytes);
    const launchDocument = buildLaunchDocument(html, urlByPath);
    const launchBlob = new Blob([launchDocument], { type: "text/html" });
    const launchUrl = URL.createObjectURL(launchBlob);
    blobUrls.push(launchUrl);

    const runtime = {
        manifest,
        coverUrl,
        launchUrl,
        dispose: () => {
            blobUrls.forEach((url) => URL.revokeObjectURL(url));
            retainedRuntimes.delete(runtime);
        },
    };

    return runtime;
};

export const openCartridgeInNewTab = async (source, fileName = "cartridge.png") => {
    const response = await fetch(source);
    if (!response.ok) {
        throw new Error("Failed to load cartridge image.");
    }

    const buffer = await response.arrayBuffer();
    const file = new File([buffer], fileName, { type: "image/png" });
    const runtime = await createCartridgeFromFile(file);
    const tab = window.open(runtime.launchUrl, "_blank", "noopener,noreferrer");

    if (!tab) {
        runtime.dispose();
        throw new Error("Popup blocked. Allow popups to launch cartridges.");
    }

    retainedRuntimes.add(runtime);
    return runtime;
};
