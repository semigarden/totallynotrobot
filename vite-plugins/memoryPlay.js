import { randomUUID } from "node:crypto";
import { extractMemory, listManifestFiles } from "memory-extract/tools/memoryFormat.mjs";
import { resolveMemoryPlayMode } from "memory-extract/src/memoryPlay.js";
import { createMemoryPlayIdleWatcher } from "memory-extract/src/memoryPlayLifecycle.js";
import { createMemoryPlayHandler } from "memory-extract/tools/playMemoryServer.mjs";

const SESSION_TTL_MS = 60 * 60 * 1000;
const REGISTER_PATH = "/api/memory-play/register";
const PLAY_PREFIX = "/api/memory-play/";

const readRequestBody = (request) =>
    new Promise((resolve, reject) => {
        const chunks = [];

        request.on("data", (chunk) => {
            chunks.push(chunk);
        });

        request.on("end", () => {
            resolve(Buffer.concat(chunks));
        });

        request.on("error", reject);
    });

const pruneSessions = (sessions) => {
    const cutoff = Date.now() - SESSION_TTL_MS;

    for (const [id, session] of sessions) {
        if (session.createdAt < cutoff) {
            session.idleWatcher?.stop();
            sessions.delete(id);
        }
    }
};

const removeSession = (sessions, sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
        return;
    }

    session.idleWatcher?.stop();
    sessions.delete(sessionId);
};

export const memoryPlayPlugin = () => {
    const sessions = new Map();

    const attachMiddleware = (server) => {
        server.middlewares.use(async (request, response, next) => {
                const requestUrl = new URL(
                    request.url ?? "/",
                    "http://localhost"
                );
                const { pathname } = requestUrl;

                if (pathname === REGISTER_PATH && request.method === "POST") {
                    try {
                        pruneSessions(sessions);
                        const body = await readRequestBody(request);
                        const { manifest, fileBytes } = extractMemory(body);
                        const filePaths = listManifestFiles(manifest);
                        const playMode = resolveMemoryPlayMode(manifest, filePaths);

                        if (playMode.mode !== "play") {
                            response.writeHead(400, {
                                "Content-Type": "text/plain; charset=utf-8",
                            });
                            response.end("Memory does not contain a playable site.");
                            return;
                        }

                        const id = randomUUID();
                        const idleWatcher = createMemoryPlayIdleWatcher({
                            onIdle: () => {
                                removeSession(sessions, id);
                            },
                        });
                        idleWatcher.touch();
                        const handler = createMemoryPlayHandler(
                            manifest,
                            fileBytes,
                            filePaths,
                            playMode.entry,
                            { idleWatcher }
                        );

                        sessions.set(id, {
                            createdAt: Date.now(),
                            handler,
                            idleWatcher,
                        });

                        response.writeHead(200, {
                            "Content-Type": "application/json; charset=utf-8",
                        });
                        response.end(
                            JSON.stringify({
                                playUrl: `${PLAY_PREFIX}${id}/`,
                            })
                        );
                    } catch (error) {
                        response.writeHead(400, {
                            "Content-Type": "text/plain; charset=utf-8",
                        });
                        response.end(error.message ?? "Invalid memory PNG.");
                    }

                    return;
                }

                const playMatch = pathname.match(
                    /^\/api\/memory-play\/([^/]+)(\/.*)?$/
                );

                if (!playMatch) {
                    next();
                    return;
                }

                const sessionId = playMatch[1];
                const session = sessions.get(sessionId);

                if (!session) {
                    response.writeHead(404, {
                        "Content-Type": "text/plain; charset=utf-8",
                    });
                    response.end("Memory session not found.");
                    return;
                }

                if (!playMatch[2]) {
                    response.writeHead(302, {
                        Location: `${PLAY_PREFIX}${sessionId}/`,
                    });
                    response.end();
                    return;
                }

                request.url = playMatch[2];
                session.handler(request, response);
            });
    };

    return {
        name: "memory-play",
        configureServer: attachMiddleware,
        configurePreviewServer: attachMiddleware,
    };
};
