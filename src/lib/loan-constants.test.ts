import { describe, it, expect } from "vitest";
import { LOAN_TYPE_LABELS, TERM_OPTIONS } from "./loan-constants";

describe("LOAN_TYPE_LABELS", () => {
  it("maps new-loan to 'New Loan'", () => {
    expect(LOAN_TYPE_LABELS["new-loan"]).toBe("New Loan");
  });

  it("maps reloan to 'Reloan'", () => {
    expect(LOAN_TYPE_LABELS["reloan"]).toBe("Reloan");
  });

  it("maps reconstruct to 'Reconstruct'", () => {
    expect(LOAN_TYPE_LABELS["reconstruct"]).toBe("Reconstruct");
  });

  it("covers all three loan types", () => {
    expect(Object.keys(LOAN_TYPE_LABELS)).toHaveLength(3);
  });
});

describe("TERM_OPTIONS", () => {
  it("contains 30, 45, and 60 day terms", () => {
    expect(TERM_OPTIONS).toContain(30);
    expect(TERM_OPTIONS).toContain(45);
    expect(TERM_OPTIONS).toContain(60);
  });

  it("has exactly 3 term options", () => {
    expect(TERM_OPTIONS).toHaveLength(3);
  });

  it("terms are in ascending order", () => {
    const sorted = [...TERM_OPTIONS].sort((a, b) => a - b);
    expect([...TERM_OPTIONS]).toEqual(sorted);
  });
});

describe("loan calculation helpers", () => {
  // These mirror the logic used in the loan creation form

  function calcTotalReceivable(principal: number, interestRate: number, processingFeeRate: number) {
    const interest = principal * interestRate;
    const fee = principal * processingFeeRate;
    return principal + interest + fee;
  }

  function calcDailyPayment(totalReceivable: number, term: number) {
    return totalReceivable / term;
  }

  function calcEfficiencyRate(collected: number, expected: number) {
    if (expected <= 0) return 0;
    return Math.min(100, Math.round((collected / expected) * 100));
  }

  it("calculates total receivable correctly", () => {
    // ₱10,000 principal, 5% interest, 2% processing fee
    expect(calcTotalReceivable(10000, 0.05, 0.02)).toBe(10700);
  });

  it("calculates daily payment correctly", () => {
    // ₱10,700 over 30 days
    expect(calcDailyPayment(10700, 30)).toBeCloseTo(356.67, 2);
  });

  it("calculates daily payment for 45 days", () => {
    expect(calcDailyPayment(10750, 45)).toBeCloseTo(238.89, 2);
  });

  it("calculates daily payment for 60 days", () => {
    expect(calcDailyPayment(10800, 60)).toBe(180);
  });

  it("efficiency rate returns 0 when expected is 0", () => {
    expect(calcEfficiencyRate(500, 0)).toBe(0);
  });

  it("efficiency rate caps at 100%", () => {
    expect(calcEfficiencyRate(9999, 100)).toBe(100);
  });

  it("efficiency rate calculates correctly", () => {
    expect(calcEfficiencyRate(750, 1000)).toBe(75);
  });

  it("efficiency rate rounds to whole number", () => {
    expect(calcEfficiencyRate(1, 3)).toBe(33);
  });
});
