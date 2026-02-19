import { describe, it, expect } from "vitest";
import {
  calculateKhums,
  createEmptyKhumsInput,
  KHUMS_RATE,
  type KhumsInput,
} from "@/lib/khums-utils";

describe("calculateKhums", () => {
  it("calculates basic surplus correctly", () => {
    const input = createEmptyKhumsInput();
    input.savings = 50000;
    input.annualExpenses = 30000;

    const result = calculateKhums(input);

    expect(result.totalIncome).toBe(50000);
    expect(result.netSurplus).toBe(20000);
    expect(result.standardKhums).toBe(4000); // 20% of 20,000
    expect(result.totalKhumsObligation).toBe(4000);
  });

  it("returns zero when expenses exceed income", () => {
    const input = createEmptyKhumsInput();
    input.savings = 10000;
    input.annualExpenses = 50000;

    const result = calculateKhums(input);

    expect(result.netSurplus).toBe(0);
    expect(result.standardKhums).toBe(0);
    expect(result.totalKhumsObligation).toBe(0);
    expect(result.sahmAlImam).toBe(0);
    expect(result.sahmAlSadat).toBe(0);
  });

  it("excludes inheritance from income", () => {
    const input = createEmptyKhumsInput();
    input.savings = 30000;
    input.inheritance = 100000;
    input.annualExpenses = 20000;

    const result = calculateKhums(input);

    // Inheritance should NOT be counted
    expect(result.totalIncome).toBe(30000);
    expect(result.netSurplus).toBe(10000);
    expect(result.standardKhums).toBe(2000);
  });

  it("includes all income sources", () => {
    const input = createEmptyKhumsInput();
    input.savings = 10000;
    input.cashOnHand = 5000;
    input.investments = 8000;
    input.businessProfits = 12000;
    input.rentalIncome = 6000;
    input.gifts = 2000;

    const result = calculateKhums(input);

    expect(result.totalIncome).toBe(43000);
  });

  it("includes property in gross surplus", () => {
    const input = createEmptyKhumsInput();
    input.savings = 20000;
    input.goldSilverPurchased = 5000;
    input.jewelryBeyondUse = 3000;
    input.unusedGoods = 2000;
    input.annualExpenses = 10000;

    const result = calculateKhums(input);

    expect(result.totalProperty).toBe(10000);
    expect(result.grossSurplus).toBe(30000);
    expect(result.netSurplus).toBe(20000);
    expect(result.standardKhums).toBe(4000);
  });

  it("applies all deductions", () => {
    const input = createEmptyKhumsInput();
    input.savings = 100000;
    input.annualExpenses = 40000;
    input.debtPayments = 15000;
    input.businessReinvestment = 10000;

    const result = calculateKhums(input);

    expect(result.totalDeductions).toBe(65000);
    expect(result.netSurplus).toBe(35000);
    expect(result.standardKhums).toBe(7000);
  });

  it("calculates advanced categories independently", () => {
    const input = createEmptyKhumsInput();
    input.kanz = 10000;
    input.madan = 5000;
    input.ghaws = 2000;
    input.propertyAppreciation = 8000;
    input.mixedHalalHaram = 3000;

    const result = calculateKhums(input);

    const expectedAdvanced = (10000 + 5000 + 2000 + 8000 + 3000) * KHUMS_RATE;
    expect(result.advancedKhums).toBe(expectedAdvanced);
    expect(result.advancedKhums).toBe(5600);
  });

  it("splits 50/50 on total obligation", () => {
    const input = createEmptyKhumsInput();
    input.savings = 50000;
    input.annualExpenses = 30000;
    input.kanz = 10000;

    const result = calculateKhums(input);

    // Standard: 20% of 20,000 = 4,000
    // Advanced: 20% of 10,000 = 2,000
    // Total: 6,000
    expect(result.totalKhumsObligation).toBe(6000);
    expect(result.sahmAlImam).toBe(3000);
    expect(result.sahmAlSadat).toBe(3000);
  });

  it("handles zero input gracefully", () => {
    const input = createEmptyKhumsInput();
    const result = calculateKhums(input);

    expect(result.totalIncome).toBe(0);
    expect(result.totalProperty).toBe(0);
    expect(result.grossSurplus).toBe(0);
    expect(result.totalDeductions).toBe(0);
    expect(result.netSurplus).toBe(0);
    expect(result.standardKhums).toBe(0);
    expect(result.advancedKhums).toBe(0);
    expect(result.totalKhumsObligation).toBe(0);
    expect(result.sahmAlImam).toBe(0);
    expect(result.sahmAlSadat).toBe(0);
  });

  it("combines standard and advanced khums correctly", () => {
    const input: KhumsInput = {
      savings: 80000,
      cashOnHand: 5000,
      investments: 15000,
      businessProfits: 20000,
      rentalIncome: 10000,
      gifts: 0,
      inheritance: 50000, // exempt
      goldSilverPurchased: 3000,
      jewelryBeyondUse: 2000,
      unusedGoods: 1000,
      annualExpenses: 60000,
      debtPayments: 10000,
      businessReinvestment: 5000,
      kanz: 5000,
      madan: 3000,
      ghaws: 0,
      propertyAppreciation: 10000,
      mixedHalalHaram: 0,
    };

    const result = calculateKhums(input);

    // Income: 80k + 5k + 15k + 20k + 10k + 0 = 130k (inheritance excluded)
    expect(result.totalIncome).toBe(130000);
    // Property: 3k + 2k + 1k = 6k
    expect(result.totalProperty).toBe(6000);
    // Gross: 136k
    expect(result.grossSurplus).toBe(136000);
    // Deductions: 60k + 10k + 5k = 75k
    expect(result.totalDeductions).toBe(75000);
    // Net: 61k
    expect(result.netSurplus).toBe(61000);
    // Standard khums: 20% of 61k = 12,200
    expect(result.standardKhums).toBe(12200);
    // Advanced: 20% of (5k + 3k + 0 + 10k + 0) = 20% of 18k = 3,600
    expect(result.advancedKhums).toBe(3600);
    // Total: 15,800
    expect(result.totalKhumsObligation).toBe(15800);
    // Split: 7,900 each
    expect(result.sahmAlImam).toBe(7900);
    expect(result.sahmAlSadat).toBe(7900);
  });
});
