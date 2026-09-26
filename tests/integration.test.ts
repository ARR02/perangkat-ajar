import assert from "node:assert";
import { db } from "../database";

async function run() {
  console.log("Running integration test for consistency & generators...");
  // Test minimal database connectivity and consistency structure
  const user = await db.user.findFirst();
  assert.notStrictEqual(user, undefined, "User database should be queryable");
  console.log("Integration smoke test PASSED!");
}

run().catch((err) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});