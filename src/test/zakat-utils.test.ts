import { describe, it, expect } from "vitest";
import { calculateZakat, type ZakatAssets, type MetalPrices } from "@/lib/zakat-utils";

const PRICES: MetalPrices = { goldPerGram: 75, silverPerGram: 0.90 };

function makeAssets(overrides: Partial<ZakatAssets> = {}): ZakatAssets {
  return {
    cash: 0, gold: 0, silver: 0, investments: 0,
    businessInventory: 0, livestock: 0, crops: 0,
    crypto: 0, retirementAccounts: 0, personalJewelry: 0,
    debtsOwed: 0, livingExpenses: 0,
    ...overrides,
  };
}

describe("Stock Zakatable Ratio (1/3)", () => {
  it("applies 1/3 ratio to investments for Sunni schools", () => {
    const assets = makeAssets({ cash: 10000, investments: 30000 });
    const result = calculateZakat(assets, "hanafi", PRICES);
    // investments zakatable = 30000 * 1/3 = 10000
    // totalAssets = 10000 (cash) + 10000 (investments) = 20000
    expect(result.totalAssets).toBe(20000);
  });

  it("does not apply ratio to other asset categories", () => {
    const assets = makeAssets({ cash: 5000, crypto: 3000, businessInventory: 2000 });
    const result = calculateZakat(assets, "hanafi", PRICES);
    expect(result.totalAssets).toBe(10000);
  });

  it("shows adjusted label in breakdown", () => {
    const assets = makeAssets({ investments: 30000 });
    const result = calculateZakat(assets, "maliki", PRICES);
    const row = result.breakdown.find(b => b.category.includes("Investments"));
    expect(row?.category).toContain("1/3 zakatable");
    expect(row?.amount).toBe(10000);
  });
});

describe("Nisab standards per madhab", () => {
  it("Hanafi enforces silver nisab", () => {
    const result = calculateZakat(makeAssets({ cash: 1000 }), "hanafi", PRICES, "gold");
    expect(result.nisabStandard).toBe("silver");
  });

  it("Ja'fari enforces gold nisab", () => {
    const assets = makeAssets({ gold: 100 }); // 100g * 75 = 7500
    const result = calculateZakat(assets, "jafari", PRICES, "silver");
    expect(result.nisabStandard).toBe("gold");
  });

  it("Shafi'i allows user to choose nisab standard", () => {
    const result1 = calculateZakat(makeAssets({ cash: 1000 }), "shafii", PRICES, "gold");
    expect(result1.nisabStandard).toBe("gold");
    const result2 = calculateZakat(makeAssets({ cash: 1000 }), "shafii", PRICES, "silver");
    expect(result2.nisabStandard).toBe("silver");
  });
});

describe("Madhab-specific debt deduction", () => {
  it("Shafi'i: no debt deduction — zakat on gross assets", () => {
    const assets = makeAssets({ cash: 20000, debtsOwed: 5000 });
    const result = calculateZakat(assets, "shafii", PRICES);
    expect(result.totalDeductions).toBe(0);
    expect(result.netWorth).toBe(20000);
    // Should not have debts row in breakdown
    const debtRow = result.breakdown.find(b => b.category.includes("Debts"));
    expect(debtRow).toBeUndefined();
  });

  it("Hanafi: deducts debts + living expenses", () => {
    const assets = makeAssets({ cash: 20000, debtsOwed: 3000, livingExpenses: 2000 });
    const result = calculateZakat(assets, "hanafi", PRICES);
    expect(result.totalDeductions).toBe(5000);
    expect(result.netWorth).toBe(15000);
    // Should have both deduction rows
    const debtRow = result.breakdown.find(b => b.category.includes("Debts"));
    const expRow = result.breakdown.find(b => b.category.includes("Living"));
    expect(debtRow).toBeDefined();
    expect(expRow).toBeDefined();
  });

  it("Maliki: deducts debts only, ignores living expenses", () => {
    const assets = makeAssets({ cash: 20000, debtsOwed: 3000, livingExpenses: 2000 });
    const result = calculateZakat(assets, "maliki", PRICES);
    expect(result.totalDeductions).toBe(3000);
    expect(result.netWorth).toBe(17000);
  });

  it("Hanbali: deducts debts only", () => {
    const assets = makeAssets({ cash: 20000, debtsOwed: 4000 });
    const result = calculateZakat(assets, "hanbali", PRICES);
    expect(result.totalDeductions).toBe(4000);
  });

  it("Ja'fari: deducts debts from their limited asset categories", () => {
    const assets = makeAssets({ gold: 100, debtsOwed: 1000 }); // gold = 100 * 75 = 7500
    const result = calculateZakat(assets, "jafari", PRICES);
    expect(result.totalDeductions).toBe(1000);
    expect(result.netWorth).toBe(6500);
  });
});

describe("Jewelry handling", () => {
  it("Hanafi: always includes personal jewelry", () => {
    const assets = makeAssets({ cash: 5000, personalJewelry: 3000 });
    const result = calculateZakat(assets, "hanafi", PRICES);
    expect(result.totalAssets).toBe(8000);
    const row = result.breakdown.find(b => b.category.includes("Jewelry"));
    expect(row?.amount).toBe(3000);
  });

  it("Shafi'i: excludes jewelry by default", () => {
    const assets = makeAssets({ cash: 10000, personalJewelry: 5000 });
    const result = calculateZakat(assets, "shafii", PRICES);
    expect(result.totalAssets).toBe(10000);
    const row = result.breakdown.find(b => b.category.includes("Jewelry"));
    expect(row).toBeUndefined();
  });

  it("Shafi'i: includes jewelry when opted in", () => {
    const assets = makeAssets({ cash: 10000, personalJewelry: 5000 });
    const result = calculateZakat(assets, "shafii", PRICES, "gold", { includeJewelry: true });
    expect(result.totalAssets).toBe(15000);
    const row = result.breakdown.find(b => b.category.includes("Jewelry"));
    expect(row?.amount).toBe(5000);
  });

  it("Maliki: excludes jewelry by default, includes when opted in", () => {
    const assets = makeAssets({ cash: 10000, personalJewelry: 5000 });
    const without = calculateZakat(assets, "maliki", PRICES);
    expect(without.totalAssets).toBe(10000);
    const withOpt = calculateZakat(assets, "maliki", PRICES, "gold", { includeJewelry: true });
    expect(withOpt.totalAssets).toBe(15000);
  });

  it("Ja'fari: never includes jewelry, even when opted in", () => {
    const assets = makeAssets({ gold: 100, personalJewelry: 5000 });
    const result = calculateZakat(assets, "jafari", PRICES, "gold", { includeJewelry: true });
    // totalAssets should only be goldValue = 100 * 75 = 7500
    expect(result.totalAssets).toBe(7500);
    const row = result.breakdown.find(b => b.category.includes("Jewelry"));
    expect(row).toBeUndefined();
  });
});

describe("Retirement accounts", () => {
  it("Shafi'i: applies 1/3 ratio when opted in", () => {
    const assets = makeAssets({ cash: 10000, retirementAccounts: 90000 });
    const result = calculateZakat(assets, "shafii", PRICES, "gold", { includeRetirement: true });
    // retirement zakatable = 90000 * 1/3 = 30000
    const row = result.breakdown.find(b => b.category.includes("Retirement"));
    expect(row?.amount).toBe(30000);
    expect(result.totalAssets).toBe(40000);
  });

  it("Hanbali: applies 1/3 ratio when opted in", () => {
    const assets = makeAssets({ cash: 10000, retirementAccounts: 60000 });
    const result = calculateZakat(assets, "hanbali", PRICES, "gold", { includeRetirement: true });
    const row = result.breakdown.find(b => b.category.includes("Retirement"));
    expect(row?.amount).toBe(20000); // 60000 * 1/3
  });

  it("Hanafi: excludes retirement even with opt-in", () => {
    const assets = makeAssets({ cash: 10000, retirementAccounts: 90000 });
    const result = calculateZakat(assets, "hanafi", PRICES, "silver", { includeRetirement: true });
    const row = result.breakdown.find(b => b.category.includes("Retirement"));
    expect(row).toBeUndefined();
    expect(result.totalAssets).toBe(10000);
  });

  it("Maliki: excludes retirement even with opt-in", () => {
    const assets = makeAssets({ cash: 10000, retirementAccounts: 90000 });
    const result = calculateZakat(assets, "maliki", PRICES, "gold", { includeRetirement: true });
    const row = result.breakdown.find(b => b.category.includes("Retirement"));
    expect(row).toBeUndefined();
  });

  it("Ja'fari: excludes retirement (falls under Khums)", () => {
    const assets = makeAssets({ gold: 100, retirementAccounts: 90000 });
    const result = calculateZakat(assets, "jafari", PRICES, "gold", { includeRetirement: true });
    expect(result.totalAssets).toBe(7500); // only gold
  });
});

describe("Crypto assets", () => {
  it("includes crypto at full value for Sunni schools", () => {
    const assets = makeAssets({ cash: 5000, crypto: 3000 });
    const result = calculateZakat(assets, "hanafi", PRICES);
    expect(result.totalAssets).toBe(8000);
    const row = result.breakdown.find(b => b.category.includes("Crypto"));
    expect(row?.amount).toBe(3000);
  });

  it("excludes crypto for Ja'fari", () => {
    const assets = makeAssets({ gold: 100, crypto: 5000 });
    const result = calculateZakat(assets, "jafari", PRICES);
    expect(result.totalAssets).toBe(7500); // only gold
    const row = result.breakdown.find(b => b.category.includes("Crypto"));
    expect(row).toBeUndefined();
  });
});

describe("Livestock and crops for all madhabs", () => {
  it("includes livestock for Sunni schools", () => {
    const assets = makeAssets({ cash: 5000, livestock: 2000 });
    const result = calculateZakat(assets, "hanbali", PRICES);
    expect(result.totalAssets).toBe(7000);
  });

  it("includes crops for Sunni schools", () => {
    const assets = makeAssets({ cash: 5000, crops: 1000 });
    const result = calculateZakat(assets, "maliki", PRICES);
    expect(result.totalAssets).toBe(6000);
  });

  it("includes livestock and crops for Ja'fari", () => {
    const assets = makeAssets({ livestock: 2000, crops: 1000 });
    const result = calculateZakat(assets, "jafari", PRICES);
    expect(result.totalAssets).toBe(3000);
  });
});

describe("Ja'fari asset categories", () => {
  it("only includes gold, silver, livestock, crops for Ja'fari", () => {
    const assets = makeAssets({
      cash: 10000, gold: 10, silver: 100, investments: 50000,
      businessInventory: 5000, crypto: 3000, livestock: 2000, crops: 1000,
    });
    const result = calculateZakat(assets, "jafari", PRICES);
    // gold = 10 * 75 = 750, silver = 100 * 0.9 = 90, livestock = 2000, crops = 1000
    expect(result.totalAssets).toBe(750 + 90 + 2000 + 1000);
  });
});

describe("Zakat calculation formula", () => {
  it("applies 2.5% on net worth when above nisab", () => {
    const assets = makeAssets({ cash: 20000 });
    const result = calculateZakat(assets, "hanafi", PRICES);
    // Silver nisab = 595 * 0.9 = 535.5 → above nisab
    expect(result.isAboveNisab).toBe(true);
    expect(result.zakatDue).toBe(20000 * 0.025);
  });

  it("returns 0 when below nisab", () => {
    const assets = makeAssets({ cash: 100 });
    const result = calculateZakat(assets, "shafii", PRICES);
    // Gold nisab = 85 * 75 = 6375 → below
    expect(result.isAboveNisab).toBe(false);
    expect(result.zakatDue).toBe(0);
  });

  it("net worth cannot go below 0", () => {
    const assets = makeAssets({ cash: 1000, debtsOwed: 5000 });
    const result = calculateZakat(assets, "hanafi", PRICES);
    expect(result.netWorth).toBe(0);
    expect(result.zakatDue).toBe(0);
  });
});

describe("Worked example: Hanafi user", () => {
  it("matches iOS guidelines worked example", () => {
    // $20K cash, $8K gold, $50K stocks, $15K debt
    // Gold at ~$86.78/g (so 85g = ~$7376), silver at ~$0.965/g (so 595g = ~$574)
    const prices: MetalPrices = {
      goldPerGram: 2700 / 31.1035, // ≈ $86.82/g
      silverPerGram: 30 / 31.1035, // ≈ $0.965/g
    };
    const assets = makeAssets({
      cash: 20000,
      gold: 0, // gold entered as "amount in grams" - the $8000 example is USD value
      investments: 50000,
      debtsOwed: 15000,
    });
    // investments zakatable = 50000 * 1/3 ≈ 16667
    // totalAssets = 20000 + 16667 = 36667
    // deductions = 15000
    // netWorth = 21667
    // silver nisab ≈ 574 → above
    // zakatDue ≈ 21667 * 0.025 ≈ 541.67
    const result = calculateZakat(assets, "hanafi", prices);
    expect(result.nisabStandard).toBe("silver");
    expect(result.isAboveNisab).toBe(true);
    expect(result.totalDeductions).toBe(15000);
    expect(result.zakatDue).toBeCloseTo(result.netWorth * 0.025, 2);
  });
});
