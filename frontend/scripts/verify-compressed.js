#!/usr/bin/env node
// Verify that build output has .br and .gz files for important assets.
// Exits with code 1 if any expected compressed file is missing.

import fs from "fs";
import path from "path";

const buildDir = path.resolve(process.cwd(), "build");
const assetDir = path.join(buildDir, "assets");

function walk(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function check() {
  if (!fs.existsSync(buildDir)) {
    console.error("Build directory not found:", buildDir);
    process.exit(1);
  }

  if (!fs.existsSync(assetDir)) {
    console.warn("No assets directory found at", assetDir);
    console.log("Nothing to verify; exiting 0");
    process.exit(0);
  }

  const files = walk(assetDir);
  const targets = files.filter(
    (f) =>
      /\.(js|css|html|svg|json)$/.test(f) &&
      !/\.gz$/.test(f) &&
      !/\.br$/.test(f)
  );

  let missing = 0;
  for (const f of targets) {
    const gz = f + ".gz";
    const br = f + ".br";
    const hasGz = fs.existsSync(gz);
    const hasBr = fs.existsSync(br);
    if (!hasGz || !hasBr) {
      missing++;
      console.error(
        "Missing compressed for",
        path.relative(buildDir, f),
        "gz=",
        hasGz,
        "br=",
        hasBr
      );
    }
  }

  if (missing > 0) {
    console.error(`Found ${missing} files missing .gz or .br companion files.`);
    process.exit(1);
  }

  console.log("All assets have .gz and .br counterparts");
  process.exit(0);
}

check();
