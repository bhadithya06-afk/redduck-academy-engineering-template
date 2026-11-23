// 04-content-derived-factory/src/factory.ts
// A content-derived factory. Fill in create() and derive(). No framework, no build step.
// Run with: npx tsx src/factory.ts

import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";

// The content an item is built from. Any set of string fields; here, a short document.
export type Content = Record<string, string>;

export interface Item {
  content: Content;
  id: string;
}

// Return an Item holding the content and an id derived from its content (use derive).
export function create(content: Content): Item {
  return {
    content: { ...content },
    id: derive(content),
  };
}

// Recompute the id from the content alone, with no registry and no shared state,
// canonicalizing key order so identical content always yields the same SHA-256 digest.
export function derive(content: Content): string {
  const canonicalEntries = Object.keys(content)
    .sort()
    .map((key) => [key, content[key]] as const);
  const canonicalPayload = JSON.stringify(canonicalEntries);
  return createHash("sha256").update(canonicalPayload).digest("hex");
}

// Demo: create an item, have a second party derive the id from the same content, then tamper.
function demo(): void {
  const content: Content = {
    title: "Quarterly report",
    body: "Revenue held steady.",
    author: "avery",
  };

  const item = create(content);

  // Second party holds only the content, in a different field order, and derives the id itself.
  const sameContent: Content = {
    author: "avery",
    body: "Revenue held steady.",
    title: "Quarterly report",
  };
  assert.equal(derive(sameContent), item.id, "same content must derive the same id");

  // Tamper with one field. The derived id must no longer match the original.
  const tampered: Content = { ...content, body: "Revenue tripled." };
  assert.notEqual(derive(tampered), item.id, "changed content must change the id");

  console.log("ok:", item.id);
}

demo();
