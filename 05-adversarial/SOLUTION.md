# Solution

## Language

language: "typescript"

## The attack

1. **Starting balances:** `attacker` holds `0` points and `victim` holds `100` points (`new Ledger({ attacker: 0, victim: 100 })`).
2. **Adversarial call:** The attacker calls `ledger.transfer("attacker", "victim", -100)` using only the published `transfer(from, to, amount)` method.
3. **Execution path inside `transfer`:**
   - `available` is read for `"attacker"` (`0`).
   - The guard `if (available < amount)` checks `0 < -100`, which evaluates to `false` and allows execution to continue.
   - `from` (`"attacker"`) is set to `0 - (-100) = 100`.
   - `to` (`"victim"`) is set to `100 + (-100) = 0`.
4. **Ending balances:** `attacker` ends with `100` points (points they were never given) and `victim` is drained to `0` points. (Passing an even larger negative number, such as `-1000`, mints arbitrary points for `attacker` while driving `victim` negative.)

## Why it works at the design level

At the design level, `transfer` accepts a signed `number` (`amount`) that controls both the **magnitude** and the **direction** of value flow, while only checking authorization (`available < amount`) on `from` under the implicit assumption that `amount` is non-negative.

Because the caller controls the sign of `amount`, passing a negative value inverts the transfer direction—turning a debit from `from` into a credit to `from`, and a credit to `to` into an unauthenticated debit from `to`—bypassing both balance sufficiency and sender authorization on `victim`.

## Patch or elimination?

- **Patching the attack (runtime guard):** Adding `if (!Number.isFinite(amount) || amount <= 0) throw new Error("invalid amount")` inside `transfer` patches the vulnerability by rejecting negative, zero, `NaN`, or infinite inputs at runtime, while still accepting a signed `number` type on the public interface.
- **Eliminating the condition (type-level / domain representation):** Representing transfer amounts with a domain type that cannot express negative values (such as an unsigned integer `bigint` / `uint` in languages with unsigned types, or a validated `PositiveAmount` value object whose constructor is the only way to obtain an amount) eliminates the condition at the interface boundary.
- **Why elimination is stronger:** A runtime guard relies on every current and future entry point remembering to check `amount <= 0` before performing arithmetic. Making negative amounts unrepresentable in the `transfer` signature removes the entire class of sign-inversion bugs by construction so bad inputs cannot even be expressed to the ledger.
