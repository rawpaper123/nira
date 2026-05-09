/**
 * Fix legacy brand text in website images.
 * Covers legacy branding with opaque color fills.
 *
 * Usage: npx tsx scripts/fix-images.ts [--debug]
 * --debug draws red outlines around fix regions instead of applying fixes.
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const PUBLIC = path.resolve(__dirname, "../public/images");

interface Cover {
  file: string;
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
}

const COVERS: Cover[] = [
  {
    // "Dit" on yellow banner in left photo of a film-strip collage
    file: "real-dates/real_dates_pic_02.webp",
    left: 0,
    top: 50,
    width: 210,
    height: 220,
    color: "#C8A84E",
  },
  {
    // Legacy brand mark on screen/projector
    file: "real-dates/real_dates_pic_03.webp",
    left: 80,
    top: 25,
    width: 380,
    height: 120,
    color: "#1A1A2E",
  },
  {
    // Legacy brand mention in white chat bubble
    file: "unforgettable/great_times_04.webp",
    left: 50,
    top: 640,
    width: 510,
    height: 155,
    color: "#FFFFFF",
  },
];

async function main() {
  const debug = process.argv.includes("--debug");
  console.log(debug ? "DEBUG MODE" : "FIXING");

  for (const c of COVERS) {
    const inputPath = path.join(PUBLIC, c.file);
    if (!fs.existsSync(inputPath)) {
      console.error(`  SKIP: ${c.file} not found`);
      continue;
    }

    const inputBuf = fs.readFileSync(inputPath);
    const meta = await sharp(inputBuf).metadata();
    const w = meta.width!;
    const h = meta.height!;

    if (debug) {
      const svg = `<svg width="${w}" height="${h}">
        <rect x="${c.left}" y="${c.top}" width="${c.width}" height="${c.height}"
          fill="none" stroke="red" stroke-width="3"/>
      </svg>`;
      const debugPath = inputPath.replace(/\.webp$/, ".debug.webp");
      await sharp(inputBuf)
        .composite([{ input: Buffer.from(svg), blend: "over" }])
        .toFile(debugPath);
      console.log(`  DEBUG: ${c.file}`);
    } else {
      const coverBuf = await sharp({
        create: {
          width: c.width,
          height: c.height,
          channels: 3,
          background: c.color,
        },
      })
        .png()
        .toBuffer();

      const outputBuf = await sharp(inputBuf)
        .composite([{ input: coverBuf, left: c.left, top: c.top }])
        .toBuffer();

      fs.writeFileSync(inputPath, outputBuf);
      console.log(`  FIXED: ${c.file}`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
