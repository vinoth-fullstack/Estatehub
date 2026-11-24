import fs from "node:fs/promises";

export type DetectedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

export async function detectImageType(filePath: string): Promise<DetectedImage | null> {
  const handle = await fs.open(filePath, "r");
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);

    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return { mime: "image/jpeg", extension: "jpg" };
    }
    if (header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { mime: "image/png", extension: "png" };
    }
    if (header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP") {
      return { mime: "image/webp", extension: "webp" };
    }
    return null;
  } finally {
    await handle.close();
  }
}
