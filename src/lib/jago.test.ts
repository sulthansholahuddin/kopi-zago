import { describe, expect, it } from "vitest";
import { dummyVaNumber, energyForOrder, NEXT_STATUSES, sizePrice } from "./jago";

describe("size prices", () => {
  it("small is 80% of the base price", () => {
    expect(sizePrice(8000, "small")).toBe(6400);
  });
  it("medium is the base price", () => {
    expect(sizePrice(12000, "medium")).toBe(12000);
  });
  it("large is 130% of the base price", () => {
    expect(sizePrice(15000, "large")).toBe(19500);
  });
});

describe("Energy points", () => {
  it("gives 1 point per Rp1.000", () => {
    expect(energyForOrder(36000)).toBe(36);
  });
  it("gives at least 10 points", () => {
    expect(energyForOrder(8000)).toBe(10);
  });
});

describe("order status flow", () => {
  it("pending orders can only be confirmed or cancelled", () => {
    expect(NEXT_STATUSES.pending).toEqual(["confirmed", "cancelled"]);
  });
  it("completed orders cannot change", () => {
    expect(NEXT_STATUSES.completed).toEqual([]);
  });
});

describe("dummy VA number", () => {
  it("starts with the bank prefix", () => {
    expect(dummyVaNumber("bca", () => 0).startsWith("3901")).toBe(true);
  });
});
