# Solution

## Language

language: "typescript"

## What was the problem

In the original design, the user store held `UserRecord` objects containing `username`, `role`, and the secret `passwordHash`, while also exposing convenience operations on top of the full records: a lookup method that returned an entire `UserRecord` and a report builder that iterated over those full records. Because `UserRecord` bundled `passwordHash` alongside public fields and flowed directly out of the store into the report rows, any caller invoking the lookup or the report automatically received every user's `passwordHash` without ever needing to breach storage.

## The split

- **Core (`UserStore`):** Holds `private users: Record<string, UserRecord>` (preserving `username`, `role`, and `passwordHash` internally) and exposes only a narrow, purpose-built interface:
  1. `verify(username, password): boolean` — checks the password hash inside the core and returns only a boolean.
  2. `getPublicProfile(username): PublicProfile | undefined` — projects the internal `UserRecord` into a new `{ username, role }` object, refusing to return `UserRecord` or `passwordHash`.
  3. `listUsernames(): string[]` — returns only the keys needed to enumerate users.
- **Periphery (`buildUserReport`):** Lives outside `UserStore` and depends solely on `listUsernames()` and `getPublicProfile(username)`. It builds the user report from `PublicProfile` objects (`{ username, role }`) and never touches `UserRecord` or `passwordHash`.

## Removal versus guarding

- **Guarding** keeps a path to the secret alive (for example, returning a full `UserRecord` behind an `isAdmin` flag, or stripping `passwordHash` via `delete record.passwordHash` in the report layer). Any caller that bypasses the guard, forgets to strip the field in a new report, or serializes the returned object still leaks the hash.
- **Removal** deletes the path from the core's interface altogether. In this split, `users` is `private` to `UserStore` and no method on `UserStore` ever returns a `UserRecord` or `passwordHash`—`getPublicProfile` constructs a fresh `{ username, role }` value containing only public fields. Because no egress channel for `passwordHash` exists on the core boundary, nothing in the periphery (or any external caller) can reach a hash by construction.
