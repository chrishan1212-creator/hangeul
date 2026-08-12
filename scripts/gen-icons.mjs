import sharp from "sharp";
import { readFileSync } from "node:fs";

const iconSvg = readFileSync(new URL("../public/icons/icon.svg", import.meta.url));
const maskableSvg = readFileSync(new URL("../public/icons/icon-maskable.svg", import.meta.url));

const jobs = [
  { src: iconSvg, size: 192, out: "public/icons/icon-192.png" },
  { src: iconSvg, size: 512, out: "public/icons/icon-512.png" },
  { src: iconSvg, size: 180, out: "public/icons/apple-touch-icon.png" },
  { src: iconSvg, size: 32, out: "public/icons/favicon-32.png" },
  { src: iconSvg, size: 16, out: "public/icons/favicon-16.png" },
  { src: maskableSvg, size: 192, out: "public/icons/icon-maskable-192.png" },
  { src: maskableSvg, size: 512, out: "public/icons/icon-maskable-512.png" },
];

for (const job of jobs) {
  await sharp(job.src, { density: 384 })
    .resize(job.size, job.size)
    .png()
    .toFile(job.out);
  console.log(`wrote ${job.out}`);
}
