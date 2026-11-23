// 01-common-sense-check/src/checkout.ts
// A minimal order service. Fix the flaw. No framework, no build step required.

export interface CatalogEntry { name: string; price: number } // price in cents
export interface OrderItemRequest { productId: string; quantity: number }
export interface OrderItem { productId: string; quantity: number; price: number }
export interface OrderRequest { items: OrderItemRequest[] }
export interface Order { id: string; items: OrderItem[]; total: number }

// Product catalog.
export const CATALOG: Record<string, CatalogEntry> = {
  "sku-blue-tshirt": { name: "Blue T-shirt", price: 2000 },
  "sku-red-mug": { name: "Red mug", price: 900 },
};

const orders: Order[] = [];

// Create an order from a request, store it, and return it.
export function createOrder(id: string, request: OrderRequest): Order {
  let total = 0;
  const pricedItems: OrderItem[] = [];

  for (const item of request.items) {
    if (!Object.prototype.hasOwnProperty.call(CATALOG, item.productId)) {
      throw new Error(`Unknown product: ${item.productId}`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid quantity for product: ${item.productId}`);
    }

    const catalogEntry = CATALOG[item.productId];
    const unitPrice = catalogEntry.price;
    total += item.quantity * unitPrice;
    pricedItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: unitPrice,
    });
  }

  const order: Order = { id, items: pricedItems, total };
  orders.push(order);
  return order;
}

// Look up a stored order by its id.
export function getOrder(id: string): Order | undefined {
  for (const order of orders) {
    if (order.id === id) {
      return order;
    }
  }
  return undefined;
}
