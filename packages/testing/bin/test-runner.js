#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const isE2E = process.argv.includes("--e2e");
const pattern = isE2E ? "test/**/*.e2e-spec.ts" : "src/**/*.spec.ts";

console.log(`\n🧪 Running ${isE2E ? "E2E" : "unit"} tests...\n`);

const startTime = Date.now();
let passedCount = 0;
let failedCount = 0;
const failedTests = [];

// Find all test files
const testFiles = globSync(pattern, {
  cwd: process.cwd(),
  absolute: true,
});

if (testFiles.length === 0) {
  console.log("⚠️  No test files found matching pattern:", pattern);
  process.exit(0);
}

console.log(`Found ${testFiles.length} test file(s)\n`);

// Run each test file
for (const testFile of testFiles) {
  const relativePath = path.relative(process.cwd(), testFile);

  try {
    // Capture output to suppress individual test summaries
    execSync(`npx ts-node "${testFile}"`, {
      stdio: "pipe",
      encoding: "utf-8",
    });

    console.log(`✅ ${relativePath}`);
    passedCount++;
  } catch (error) {
    console.log(`❌ ${relativePath}`);
    if (error.stdout) {
      console.log(error.stdout.toString());
    }
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    failedCount++;
    failedTests.push(relativePath);
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);

// Print summary
console.log("\n" + "═".repeat(50));
console.log(`\n📊 Test Summary\n`);
console.log(`  Total:  ${testFiles.length}`);
console.log(`  ✅ Passed: ${passedCount}`);
console.log(`  ❌ Failed: ${failedCount}`);
console.log(`  ⏱️  Duration: ${duration}s\n`);

if (failedCount > 0) {
  console.log("Failed tests:");
  failedTests.forEach((test) => console.log(`  - ${test}`));
  console.log("");
  process.exit(1);
} else {
  console.log("🎉 All tests passed!\n");
  process.exit(0);
}
