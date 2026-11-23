# Solution

## Problem 1

**Verdict:** bypass exists

**The exact constraint:** To display the current running total, the dashboard must read and sum all 100,000 individual records at query time.

**Reasoning:** Re-scanning every historical record is an artifact of computing the aggregate lazily from raw rows rather than an intrinsic property of knowing a sum. Because addition is associative and incremental ($\text{total}_{\text{new}} = \text{total}_{\text{old}} + \Delta$), the current total depends only on the previous total and the delta of each mutation, not on re-reading unchanged history.

**If a bypass exists, how it removes the constraint:** Maintain a single precomputed running-total record (a materialized aggregate) updated atomically within the same transaction whenever a record is inserted, updated, or deleted. When the dashboard loads, it performs a single $O(1)$ read of that scalar counter. The finished design never scans the 100,000 records on read, completely removing the $O(N)$ read constraint rather than merely caching or batching scans.

---

## Problem 2

**Verdict:** no bypass

**The exact constraint:** Confirming with certainty that a message reached the recipient over a single channel that can silently drop arbitrary messages requires exchanging confirmation messages across that unreliable channel.

**Reasoning:** This constraint is intrinsic to the outcome because the problem is equivalent to the Two Generals' Problem. Since the lossy channel is the *only* communication path between the sender and the recipient and can drop any message—including acknowledgements—no finite protocol can guarantee certainty for the sender. By induction on any protocol of $k$ messages: if the sender could be certain after $k$ messages, then the $k$-th message (the final confirmation from recipient to sender) could be dropped by the channel without changing the recipient's state, leaving the sender unable to distinguish "message never arrived" from "message arrived, but the final acknowledgement was lost." Because certainty of knowledge requires information to travel from the recipient back to the sender, and the only available medium can silently erase that information, no redesign of the messaging protocol can bypass the constraint.

---

## Problem 3

**Verdict:** bypass exists

**The exact constraint:** Preventing a duplicate charge requires detecting and blocking the second click in real time before a second submission reaches the server.

**Reasoning:** Watching for and blocking a second click in time is a property of UI race-condition prevention, not of the business outcome. The actual outcome required is *idempotent, at-most-once settlement* of a single payment intent. Trying to catch duplicate clicks in time only shrinks the race window and still fails under network retries, browser refreshes, or multiple open tabs.

**If a bypass exists, how it removes the constraint:** Generate a unique idempotency key (such as a UUID) per payment intent when the form/checkout session is initialized, attach it to the submission, and enforce uniqueness atomically at the persistence/ledger layer (for example, a unique constraint on `idempotency_key` inside the same database transaction that records the charge). If two identical submissions arrive 1 millisecond apart or 10 seconds apart, the first commits the charge and the second hits the existing key and returns the original outcome without executing a second charge. Because duplicate requests are inherently harmless, the system no longer needs to catch or block fast clicks in time at all.
