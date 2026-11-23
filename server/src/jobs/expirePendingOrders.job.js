import {
  findExpiredPendingOrdersDAO,
  restoreItemsStockDAO,
  transitionOrderStatusDAO,
} from "../DAO/order.dao.js";

// Cancels online orders that were never paid and gives the stock back
export const expirePendingOrders = async () => {
  const expired = await findExpiredPendingOrdersDAO(new Date());

  for (const { _id } of expired) {
    // Atomic: if the payment landed a moment ago, the order is no longer
    // "pending_payment", this returns null, and nothing is cancelled.
    const cancelled = await transitionOrderStatusDAO({
      orderId: _id,
      fromStatuses: ["pending_payment"],
      toStatus: "cancelled",
      note: "Payment not completed in time",
      extraSet: {
        cancelledAt: new Date(),
        cancelReason: "Payment not completed in time",
        paymentStatus: "failed",
        paymentExpiresAt: null,
      },
    });

    if (cancelled) {
      await restoreItemsStockDAO(cancelled.items);
    }
  }
};

// Call once after the database is connected
export const startPendingOrderExpiryJob = (intervalMs = 60 * 1000) => {
  const timer = setInterval(() => {
    expirePendingOrders().catch((error) =>
      console.error("Order expiry job failed", error),
    );
  }, intervalMs);

  timer.unref(); // don't keep the process alive just for this timer
  return timer;
};
