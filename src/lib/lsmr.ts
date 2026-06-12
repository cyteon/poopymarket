export type OUTCOME = "YES" | "NO";

function logSumExp(a: number, b: number): number {
  const max = Math.max(a, b);
  return max + Math.log(Math.exp(a - max) + Math.exp(b - max));
}

export function price(b: number, qYes: number, qNo: number): number {
  return 1 / (1 + Math.exp(-(qYes - qNo) / b));
}
