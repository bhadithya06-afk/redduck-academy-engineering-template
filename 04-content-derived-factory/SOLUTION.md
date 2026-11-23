# Solution

## Language

language: "typescript"

## Why derive the identifier from content

A registry maps an arbitrary identifier (such as an auto-incrementing integer or random UUID) to a piece of content stored in a central table. Relying on a registry forces every verifier to trust the registry operator, its network availability, and its storage integrity: if the registry is compromised, misconfigured, or offline, it can silently rebind an existing ID to altered content or fail to verify the item at all.

When the identifier is derived deterministically from canonicalized content via a cryptographic hash (`SHA-256` over sorted `[key, value]` entries), the binding between identifier and content is mathematical rather than administrative. Any party holding the content can independently recompute the identifier offline with zero shared state, removing the need to query or trust a central authority.

## What changes when the content changes

Because the identifier is a cryptographic function of every key and value in the content, modifying even a single character produces a completely different identifier.

- **As a feature (tamper-evidence):** Content-derived identity turns every item into a self-verifying artifact. If a middleman or storage layer substitutes or edits any field, a recipient recomputing `derive(content)` immediately detects the mismatch without needing signatures or audit logs from a registry.
- **As a constraint (immutability of identity):** You cannot update an item's content in place while keeping the same identifier. Any legitimate edit produces a brand-new identifier, which means mutable references (such as "latest version of a document") cannot be represented by the content ID itself and must instead be tracked through a separate pointer or version chain.
