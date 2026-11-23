// 03-core-periphery/src/Store.ts  —  TYPESCRIPT version.
// Only edit this file if you chose TypeScript, and complete just one language.
// Then declare it at the top of SOLUTION.md:  language: "typescript"
//
// Given (do not edit): ./store-data holds the UserRecord type, the seed users,
// and the hash helper. Done for you: verify, which returns only a boolean.
// Your job:
//   - add a hash-free public-profile lookup that returns username and role,
//   - rebuild report so it lists every user without ever including a hash.
// Full description in TASK.md.

import { SEED_USERS, UserRecord, hash } from "./store-data";

export interface PublicProfile {
  username: string;
  role: string;
}

// CORE: Holds the sensitive UserRecord map (including passwordHash) privately
// and exposes only a narrow interface (verify + hash-free profile reads).
export class UserStore {
  private users: Record<string, UserRecord>;

  constructor(initialUsers: Record<string, UserRecord> = SEED_USERS) {
    this.users = { ...initialUsers };
  }

  // The one legitimate core operation. It checks a password and returns only a boolean.
  verify(username: string, password: string): boolean {
    const user = this.users[username];
    if (!user) return false;
    return user.passwordHash === hash(password);
  }

  // Narrow, hash-free public-profile lookup returning only username and role.
  getPublicProfile(username: string): PublicProfile | undefined {
    const user = this.users[username];
    if (!user) return undefined;
    return {
      username: user.username,
      role: user.role,
    };
  }

  // Narrow enumeration of known usernames so peripheral reporting can iterate
  // without direct access to private UserRecord entries.
  listUsernames(): string[] {
    return Object.keys(this.users);
  }
}

// PERIPHERY: Built strictly on top of UserStore's narrow public interface.
// It has no reference to UserRecord or passwordHash and cannot obtain a hash.
export function buildUserReport(store: UserStore): PublicProfile[] {
  const report: PublicProfile[] = [];
  for (const username of store.listUsernames()) {
    const profile = store.getPublicProfile(username);
    if (profile) {
      report.push(profile);
    }
  }
  return report;
}
