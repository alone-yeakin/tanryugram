import type { Express, Request, Response } from "express";
import { ENV } from "./env";

const APK_KEY = "TanRyuGram-universal-firebase-debug_70fa8937.apk";

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
  const sendApk = async (req: Request, res: Response) => {
    // Stream the hosted asset from the server so Android never receives a
    // redirect body or a signed-storage URL as the downloaded file contents.
    const requestHost = req.get("host") || "";
    const origin = /^(localhost|127\\.0\\.0\\.1)(:\\d+)?$/i.test(requestHost)
      ? "https://tanryugram-njs4tc3o.manus.space"
      : `${req.protocol}://${requestHost}`;
    const assetUrl = `${origin}/manus-storage/${encodeURIComponent(APK_KEY)}`;

    try {
      const assetResp = await fetch(assetUrl, {
        headers: { Accept: "application/vnd.android.package-archive, application/octet-stream" },
      });
      if (!assetResp.ok) {
        console.error(`[StorageProxy] APK asset error: ${assetResp.status}`);
        res.status(502).send("APK asset unavailable");
        return;
      }
      const body = Buffer.from(await assetResp.arrayBuffer());
      if (body.length < 4 || body.subarray(0, 2).toString() !== "PK") {
        console.error("[StorageProxy] APK asset did not return a ZIP/APK binary");
        res.status(502).send("APK asset was not a binary package");
        return;
      }
      res.status(200);
      res.set("Content-Type", "application/vnd.android.package-archive");
      res.set("Content-Length", String(body.length));
      res.set("Content-Disposition", 'attachment; filename="TanRyuGram-universal.apk"');
      res.set("Cache-Control", "private, no-store");
      res.set("X-Content-Type-Options", "nosniff");
      res.send(body);
    } catch (error) {
      console.error("[StorageProxy] APK download failed:", error);
      res.status(502).send("APK download failed");
    }
  };
  app.get("/api/download/tanryugram.apk", (req, res) => void sendApk(req, res));
  app.get("/api/download/tanryugram-v2.apk", (req, res) => void sendApk(req, res));
}
