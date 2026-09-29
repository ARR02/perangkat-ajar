import assert from "node:assert";
import { getFixPlan } from "../services/consistency";

function issue(type: string): { type: string; impact: "high"; message: string } {
  return { type, impact: "high", message: type };
}

const cases = [
  {
    name: "memetakan issue ke dokumen yang harus dibuat ulang",
    input: [issue("ATP_TP_MISSING"), issue("LKPD_MODUL_MISSING")],
    expected: ["ATP", "LKPD"],
  },
  {
    name: "mengurutkan sesuai rantai dependensi CP→TP→ATP→…",
    input: [issue("MODUL_ATP_MISSING"), issue("TP_CP_MISMATCH"), issue("ATP_TP_MISSING")],
    expected: ["TP", "ATP", "MODUL_AJAR"],
  },
  {
    name: "mendedup issue ganda untuk dokumen yang sama",
    input: [issue("ATP_TP_MISSING"), issue("ATP_TP_MISSING")],
    expected: ["ATP"],
  },
  {
    name: "mengabaikan issue yang bukan perbaikan otomatis",
    input: [issue("PROTA_ALLOC_EXCESS"), issue("MISSING_CURRICULUM")],
    expected: [],
  },
  {
    name: "mengabaikan tipe issue tak dikenal",
    input: [issue("FOO_BAR")],
    expected: [],
  },
  {
    name: "tanpa issue → plan kosong",
    input: [],
    expected: [],
  },
];

for (const c of cases) {
  const plan = getFixPlan(c.input);
  assert.deepStrictEqual(
    plan.map((p) => p.docKey),
    c.expected,
    c.name
  );
  for (const item of plan) {
    assert.ok(item.reason.length > 0, `reason tidak boleh kosong — ${c.name}`);
  }
}

console.log(`All ${cases.length} getFixPlan tests PASSED successfully!`);