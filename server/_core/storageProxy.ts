import type { Express, Request, Response } from "express";
import { ENV } from "./env";

async function serveStorageMedia(req: Request, res: Response) {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

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

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      const mediaResp = await fetch(url);
      if (!mediaResp.ok) {
        console.error(`[StorageProxy] signed media error: ${mediaResp.status}`);
        res.status(502).send("Stored media unavailable");
        return;
      }
      const contentLength = Number(mediaResp.headers.get("content-length") || 0);
      if (contentLength > 15 * 1024 * 1024) {
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
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
      res.set("Access-Control-Allow-Origin", "*");
      res.send(body);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
}

export function registerStorageProxy(app: Express) {
  // Keep the legacy storage route for stored records and uploads, while the
  // app-owned route returns media bytes directly without platform redirects.
  app.get("/manus-storage/*", serveStorageMedia);
  app.get("/api/media-proxy/*", serveStorageMedia);
}
