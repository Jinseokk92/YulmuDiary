/**
 * PWA 아이콘 생성 스크립트
 *
 * 사용법:
 *   1. public/icons/icon-512x512.png 에 원본 512x512 아이콘을 배치
 *   2. npm install sharp --save-dev
 *   3. node scripts/generate-icons.js
 *
 * 필요한 사이즈의 아이콘을 자동 생성합니다.
 */

const sharp = require("sharp");
const path = require("path");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const INPUT = path.join(__dirname, "../public/icons/icon-512x512.png");
const OUTPUT_DIR = path.join(__dirname, "../public/icons");

async function generate() {
  for (const size of SIZES) {
    const output = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(INPUT).resize(size, size).png().toFile(output);
    console.log(`Generated: icon-${size}x${size}.png`);
  }
  console.log("Done!");
}

generate().catch(console.error);
