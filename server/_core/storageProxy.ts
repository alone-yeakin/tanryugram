import type { Express, Request, Response } from "express";
import { ENV } from "./env";

const APK_KEY = "TanRyuGram-universal-debug_4d8817b3.apk";

async function fetchStoredObject(key: string, res: Response, downloadName?: string) {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    res.status(500).send("Storage proxy not configured");
    return;
  }

  try {
    const forgeUrl = new URL(
      "v1/storage/presign/get",
      ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
    );
    forgeUrl.searchParams.set("path", key);

    const forgeResp = await fetch(forgeUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      res.status(502).send("Storage backend error");
      return;
    }

    const signed = (await forgeResp.json()) as { url?: string };
    if (!signed.url) {
      res.status(502).send("Empty signed URL from backend");
      return;
    }

    const mediaResp = await fetch(signed.url);
    if (!mediaResp.ok) {
      console.error(`[StorageProxy] signed media error: ${mediaResp.status}`);
      res.status(502).send("Stored media unavailable");
      return;
    }

    const contentLength = Number(mediaResp.headers.get("content-length") || 0);
    if (contentLength > 50 * 1024 * 1024) {
      res.status(413).send("Stored media is too large to proxy");
      return;
    }

    const body = Buffer.from(await mediaResp.arrayBuffer());
    if (!body.length) {
      res.status(404).send("Stored media is empty");
      return;
    }

    res.status(200);
    res.set("Content-Type", mediaResp.headers.get("content-type") || "application/octet-stream");
    res.set("Content-Length", String(body.length));
    res.set("Cache-Control", downloadName ? "private, no-store" : "public, max-age=300, stale-while-revalidate=3600");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("X-Content-Type-Options", "nosniff");
    if (downloadName) {
      res.set("Content-Disposition", `attachment; filename=\"${downloadName}\"`);
    }
    res.send(body);
  } catch (error) {
    console.error("[StorageProxy] failed:", error);
    res.status(502).send("Storage proxy error");
  }
}

function requestKey(req: Request) {
  const key = (req.params as Record<string, string>)[0];
  return key ? decodeURIComponent(key).replace(/^\/+/, "") : "";
}

export function registerStorageProxy(app: Express) {
  const handleMedia = (req: Request, res: Response) => {
    const key = requestKey(req);
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    void fetchStoredObject(key, res);
  };

  // Keep the old route for compatibility, but have the client use the API route
  // below because some production hosts intercept /manus-storage with a redirect.
  app.get("/manus-storage/*", handleMedia);
  app.get("/api/media-proxy/*", handleMedia);
  app.get("/api/download/tanryugram.apk", (_req, res) => {
    void fetchStoredObject(APK_KEY, res, "TanRyuGram-universal-debug.apk");
  });
}
