import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { connection } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { backendEnabled } from "@/lib/server/db";

/** The database dumps the backup service writes (deploy/docker-compose.yml), for admins only:
 *  GET lists them, GET ?file=<name> downloads one. Nothing here can write or delete. */
const NAME = /^mazen-\d{4}-\d{2}-\d{2}-\d{4}\.dump$/;
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  await connection();
  const dir = process.env.BACKUP_DIR;
  if (!backendEnabled() || !dir) return Response.json({ error: "no-backups" }, { status: 404, headers });
  const user = await currentUser();
  if (!user?.admin) return Response.json({ error: "forbidden" }, { status: 403, headers });

  const file = new URL(request.url).searchParams.get("file");
  if (file !== null) {
    // only a name the backup service would write, never a path
    if (!NAME.test(file)) return Response.json({ error: "bad-name" }, { status: 400, headers });
    const path = join(dir, file);
    const info = await stat(path).catch(() => null);
    if (!info?.isFile()) return Response.json({ error: "not-found" }, { status: 404, headers });
    return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, {
      headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Length": String(info.size), "Content-Disposition": `attachment; filename="${file}"` },
    });
  }

  const names = (await readdir(dir).catch(() => [] as string[])).filter((n) => NAME.test(n)).sort().reverse();
  const backups = await Promise.all(
    names.map(async (name) => {
      const info = await stat(join(dir, name));
      return { name, bytes: info.size, at: info.mtime.toISOString() };
    }),
  );
  return Response.json({ backups }, { headers });
}
