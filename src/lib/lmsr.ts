export type Outcome = "YES" | "NO";

function logSumExp(a: number, b: number): number {
  const max = Math.max(a, b);
  return max + Math.log(Math.exp(a - max) + Math.exp(b - max));
}

export function price(b: number, qYes: number, qNo: number): number {
  return 1 / (1 + Math.exp(-(qYes - qNo) / b));
}

export function cost(b: number, qYes: number, qNo: number): number {
  return b * logSumExp(qYes / b, qNo / b);
}

export function sharesForSpend(
  b: number,
  qYes: number,
  qNo: number,
  outcome: Outcome,
  spend: number,
): number {
  if (spend <= 0) return 0;

  const [qSame, qOther] = outcome === "YES" ? [qYes, qNo] : [qNo, qYes];
  const d = (cost(b, qYes, qNo) + spend) / b - qOther / b;
  const lnExmp1 = d > 36 ? d : Math.log(Math.expm1(d));
  return qOther + b * lnExmp1 - qSame;
}

export function priceAfterTrade(
  b: number,
  qYes: number,
  qNo: number,
  outcome: Outcome,
  shares: number,
): number {
  const newYes = outcome === "YES" ? qYes + shares : qYes;
  const newNo = outcome === "NO" ? qNo + shares : qNo;

  return price(b, newYes, newNo);
}
