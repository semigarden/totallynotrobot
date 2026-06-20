export const CARTRIDGE_MAGIC = new Uint8Array([0x57, 0x4c, 0x46, 0x43]); // WLFC
export const CARTRIDGE_CHUNK_TYPE = new Uint8Array([0x77, 0x4c, 0x46, 0x43]); // wLFC
export const CARTRIDGE_VERSION = 1;

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const bytesMatch = (view, offset, magic) => {
    if (offset < 0 || offset + magic.length > view.length) return false;
    for (let index = 0; index < magic.length; index += 1) {
        if (view[offset + index] !== magic[index]) return false;
    }
    return true;
};

const readUint32BE = (view, offset) =>
    (view[offset] << 24) |
    (view[offset + 1] << 16) |
    (view[offset + 2] << 8) |
    view[offset + 3];

const parsePngChunks = (view) => {
    if (view.length < 8 || !bytesMatch(view, 0, PNG_SIGNATURE)) {
        throw new Error("Invalid PNG signature.");
    }

    const chunks = [];
    let offset = 8;

    while (offset + 12 <= view.length) {
        const length = readUint32BE(view, offset);
        const type = view.slice(offset + 4, offset + 8);
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;

        if (dataEnd + 4 > view.length) {
            throw new Error("PNG chunk exceeds file size.");
        }

        chunks.push({
            type: String.fromCharCode(...type),
            data: view.slice(dataStart, dataEnd),
            start: offset,
            end: dataEnd + 4,
        });

        offset = dataEnd + 4;

        if (chunks[chunks.length - 1].type === "IEND") {
            break;
        }
    }

    return { view, chunks, trailing: view.slice(offset) };
};

const readCartridgePayload = (chunkData) => {
    if (chunkData.length < 8 || !bytesMatch(chunkData, 0, CARTRIDGE_MAGIC)) {
        throw new Error("Cartridge chunk magic mismatch.");
    }

    const version = readUint32BE(chunkData, 4);
    const payload = chunkData.slice(8);

    if (version !== CARTRIDGE_VERSION) {
        throw new Error(`Unsupported cartridge version: ${version}`);
    }

    return { version, payload };
};

const extractLegacyFooter = async (view) => {
    let magicIndex = -1;
    for (let index = view.length - CARTRIDGE_MAGIC.length; index >= 0; index -= 1) {
        if (bytesMatch(view, index, CARTRIDGE_MAGIC)) {
            magicIndex = index;
            break;
        }
    }

    if (magicIndex < 0) {
        throw new Error("Cartridge footer not found.");
    }

    const version = readUint32BE(view, magicIndex + 4);
    const payloadLength = readUint32BE(view, magicIndex + 8);
    const payloadStart = magicIndex + 12;
    const payloadEnd = payloadStart + payloadLength;

    if (version !== CARTRIDGE_VERSION) {
        throw new Error(`Unsupported cartridge version: ${version}`);
    }

    if (payloadEnd > view.length) {
        throw new Error("Cartridge payload length exceeds file size.");
    }

    const manifest = await decodeManifest(view.slice(payloadStart, payloadEnd));

    return {
        png: view.slice(0, magicIndex),
        payload: view.slice(payloadStart, payloadEnd),
        manifest,
        version,
    };
};

export const decodeManifest = async (payload) => {
    const stream = new Blob([payload])
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    return JSON.parse(text);
};

export const extractCartridge = async (input) => {
    const view = input instanceof Uint8Array ? input : new Uint8Array(input);

    if (view.length < 12) {
        throw new Error("File is too small to be a cartridge.");
    }

    try {
        const { view: pngView, chunks, trailing } = parsePngChunks(view);
        const cartridgeChunk = chunks.find((chunk) => chunk.type === "wLFC");

        if (cartridgeChunk) {
            const { version, payload } = readCartridgePayload(cartridgeChunk.data);
            const manifest = await decodeManifest(payload);

            return {
                png: pngView,
                payload,
                manifest,
                version,
            };
        }

        if (trailing.length > 0) {
            return extractLegacyFooter(view);
        }
    } catch {
        return extractLegacyFooter(view);
    }

    throw new Error("Cartridge chunk not found.");
};

export const decodeManifestFile = (fileRecord) => {
    if (!fileRecord?.data) {
        throw new Error("Invalid manifest file record.");
    }

    const binary = atob(fileRecord.data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
};
