export function getTermInterestRate(termDays: number): number {
  if (termDays === 30) return 5;
  if (termDays === 45) return 7.5;
  if (termDays === 60) return 10;
  return Math.round((termDays / 30) * 5 * 10) / 10;
}

export function calcInterest(principal: number, termDays: number): number {
  return Math.round(principal * getTermInterestRate(termDays) / 100);
}

export function calcServiceCharge(principal: number, scRatePercent: number): number {
  return Math.round(principal * scRatePercent / 100);
}

export function calcTotalReceivable(principal: number, interest: number, serviceCharge: number): number {
  return principal + interest + serviceCharge;
}

/** Daily payment rounds UP so the loan fully clears within the term. */
export function calcDailyPayment(totalReceivable: number, termDays: number): number {
  if (termDays <= 0 || totalReceivable <= 0) return 0;
  return Math.ceil(totalReceivable / termDays);
}

/** Balance is clamped at 0 — overpayments never produce a negative balance. */
export function calcNewBalance(currentBalance: number, payment: number): number {
  return Math.max(0, currentBalance - payment);
}

export function calcEfficiencyRate(collected: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(100, Math.round((collected / expected) * 100));
}
