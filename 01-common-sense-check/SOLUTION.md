# Solution

## Language

language: "typescript"

## The flaw

The order service trusts the unit `price` supplied by the caller inside each request item instead of looking up the product's price from the server-side `CATALOG`, and it never checks whether `productId` exists in `CATALOG`.

**Exploit sequence (self-interested buyer):**
1. A buyer inspects the checkout request payload (`{ "items": [{ "productId": "sku-blue-tshirt", "quantity": 1, "price": 2000 }] }`) where a Blue T-shirt costs 2,000 cents ($20.00).
2. Before sending the request to `createOrder`, the buyer edits the JSON payload to set `"price": 1` (or `"price": 0`, or even a negative value to offset other items in the cart):
   `{ "items": [{ "productId": "sku-blue-tshirt", "quantity": 1, "price": 1 }] }`.
3. `createOrder` multiplies `item.quantity * item.price` (`1 * 1 = 1`), records an order with `total: 1` cent ($0.01) for a $20.00 Blue T-shirt, and stores it as a valid order.
4. Additionally, a caller can submit an arbitrary, non-existent `productId` (such as `"sku-free-laptop"`) with any `price` and the service accepts it without verifying the SKU against `CATALOG`.

## The fix

1. **Removed `price` from the request input model (`OrderItemRequest`):** Callers now pass only `{ productId, quantity }` in `OrderRequest.items`; unit price is no longer an input field accepted from the client.
2. **Enforced server-authoritative catalog lookup and validation:** Inside `createOrder`, each `item.productId` is verified against `CATALOG` (`Object.prototype.hasOwnProperty.call(CATALOG, item.productId)`), throwing an error if the product ID is unknown (and rejecting non-positive/non-integer quantities).
3. **Computed totals strictly from `CATALOG[item.productId].price`:** The server reads the authoritative `unitPrice` from `CATALOG`, computes `total += item.quantity * unitPrice`, and constructs the stored `OrderItem` records with the catalog price.

Because `createOrder` never reads a price from the request and rejects unknown SKUs before computing totals, a caller can no longer alter item prices or inject fake products.

## Patch or elimination?

This fix **removes the condition** that made the flaw possible rather than merely patching or guarding the input.

- **What a patch would look like:** Keeping `price` on `OrderItemRequest` and adding a guard like `if (item.price !== CATALOG[item.productId].price) throw new Error(...)` or `if (item.price <= 0) ...`. That still exposes an untrusted `price` field on the API boundary and relies on validation logic to catch bad values.
- **Why elimination is stronger:** Removing `price` from `OrderItemRequest` eliminates the root condition—client-controlled pricing—from the interface altogether. An attacker cannot supply a spoofed price when no input parameter exists for it, and the server has a single source of truth (`CATALOG`) for pricing. There is no validation edge case (such as negative prices, `NaN`, or stale client prices) to miss because the untrusted input channel no longer exists.
