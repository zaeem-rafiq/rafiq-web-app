// Madhab values match iOS enum raw values (lowercase, no punctuation)
export type Madhab = "hanafi" | "shafii" | "maliki" | "hanbali" | "jafari";
export type NisabStandard = "gold" | "silver";

export interface ZakatAssets {
  cash: number;
  gold: number;               // grams
  silver: number;             // grams
  investments: number;        // stocks/funds — 1/3 ratio applied automatically
  businessInventory: number;
  livestock: number;          // USD value
  crops: number;              // USD value
  crypto: number;             // USD value
  retirementAccounts: number; // USD value
  personalJewelry: number;    // USD value
  debtsOwed: number;
  livingExpenses: number;     // USD value — Hanafi only
}

export interface MetalPrices {
  goldPerGram: number;
  silverPerGram: number;
}

export interface ZakatResult {
  totalAssets: number;
  totalDeductions: number;
  netWorth: number;
  nisabThreshold: number;
  nisabStandard: NisabStandard;
  zakatDue: number;
  isAboveNisab: boolean;
  breakdown: {
    category: string;
    amount: number;
    zakatOn: number;
  }[];
  isJafari: boolean;
}

const NISAB_GOLD_GRAMS = 85;   // 85 grams of gold
const NISAB_SILVER_GRAMS = 595; // 595 grams of silver
const ZAKAT_RATE = 0.025;       // 2.5%
const STOCK_ZAKATABLE_RATIO = 1 / 3; // Only ~1/3 of stock value is zakatable (tangible fixed assets exempt)

export function calculateZakat(
  assets: ZakatAssets,
  madhab: Madhab,
  prices: MetalPrices,
  nisabStandard: NisabStandard = "gold",
  options?: {
    includeJewelry?: boolean;
    includeRetirement?: boolean;
  }
): ZakatResult {
  const isJafari = madhab === "jafari";

  // Calculate asset values
  const goldValue = assets.gold * prices.goldPerGram;
  const silverValue = assets.silver * prices.silverPerGram;
  const investmentsZakatable = assets.investments * STOCK_ZAKATABLE_RATIO;

  // Jewelry handling — madhab-dependent
  let jewelryValue = 0;
  if (madhab === "hanafi") {
    jewelryValue = assets.personalJewelry; // Hanafi: always included
  } else if (isJafari) {
    jewelryValue = 0; // Ja'fari: never included
  } else if (options?.includeJewelry) {
    jewelryValue = assets.personalJewelry; // Shafi'i/Maliki/Hanbali: opt-in
  }

  // Retirement handling — madhab-dependent
  let retirementValue = 0;
  if ((madhab === "shafii" || madhab === "hanbali") && options?.includeRetirement) {
    retirementValue = assets.retirementAccounts * STOCK_ZAKATABLE_RATIO;
  }

  // Calculate total assets
  const totalAssets = isJafari
    ? goldValue + silverValue + assets.livestock + assets.crops
    : assets.cash + goldValue + silverValue + investmentsZakatable
      + assets.businessInventory + assets.crypto
      + assets.livestock + assets.crops
      + jewelryValue + retirementValue;

  // Madhab-specific deductions
  let totalDeductions = 0;
  if (madhab === "shafii") {
    totalDeductions = 0; // Shafi'i: no debt deduction — zakat on gross assets
  } else if (madhab === "hanafi") {
    totalDeductions = assets.debtsOwed + assets.livingExpenses; // Hanafi: debts + living expenses
  } else {
    totalDeductions = assets.debtsOwed; // Maliki, Hanbali, Ja'fari: debts only
  }

  const netWorth = Math.max(0, totalAssets - totalDeductions);

  // Determine Nisab
  let effectiveNisabStandard = nisabStandard;
  if (madhab === "hanafi") {
    effectiveNisabStandard = "silver"; // Hanafi uses silver
  } else if (isJafari) {
    effectiveNisabStandard = "gold"; // Ja'fari uses gold for their zakat categories
  }

  const nisabThreshold = effectiveNisabStandard === "gold"
    ? NISAB_GOLD_GRAMS * prices.goldPerGram
    : NISAB_SILVER_GRAMS * prices.silverPerGram;

  const isAboveNisab = netWorth >= nisabThreshold;

  let zakatDue = 0;
  const breakdown: ZakatResult["breakdown"] = [];

  if (isJafari) {
    // Ja'fari: Zakat applies only to gold, silver, livestock, and crops
    // Cash, investments, & crypto fall under Khums (handled in the Khums tab)
    if (isAboveNisab) {
      zakatDue = netWorth * ZAKAT_RATE;
    }

    breakdown.push(
      { category: "Gold", amount: goldValue, zakatOn: isAboveNisab ? goldValue * ZAKAT_RATE : 0 },
      { category: "Silver", amount: silverValue, zakatOn: isAboveNisab ? silverValue * ZAKAT_RATE : 0 },
      { category: "Livestock", amount: assets.livestock, zakatOn: isAboveNisab ? assets.livestock * ZAKAT_RATE : 0 },
      { category: "Agricultural Produce", amount: assets.crops, zakatOn: isAboveNisab ? assets.crops * ZAKAT_RATE : 0 },
      { category: "Debts Owed", amount: -assets.debtsOwed, zakatOn: 0 },
    );
  } else {
    // Standard Sunni calculation
    if (isAboveNisab) {
      zakatDue = netWorth * ZAKAT_RATE;
    }

    breakdown.push(
      { category: "Cash & Bank Accounts", amount: assets.cash, zakatOn: isAboveNisab ? assets.cash * ZAKAT_RATE : 0 },
      { category: "Gold", amount: goldValue, zakatOn: isAboveNisab ? goldValue * ZAKAT_RATE : 0 },
      { category: "Silver", amount: silverValue, zakatOn: isAboveNisab ? silverValue * ZAKAT_RATE : 0 },
      { category: "Investments (1/3 zakatable)", amount: investmentsZakatable, zakatOn: isAboveNisab ? investmentsZakatable * ZAKAT_RATE : 0 },
      { category: "Business Inventory", amount: assets.businessInventory, zakatOn: isAboveNisab ? assets.businessInventory * ZAKAT_RATE : 0 },
      { category: "Crypto Assets", amount: assets.crypto, zakatOn: isAboveNisab ? assets.crypto * ZAKAT_RATE : 0 },
      { category: "Livestock", amount: assets.livestock, zakatOn: isAboveNisab ? assets.livestock * ZAKAT_RATE : 0 },
      { category: "Agricultural Produce", amount: assets.crops, zakatOn: isAboveNisab ? assets.crops * ZAKAT_RATE : 0 },
    );

    // Conditional rows
    if (jewelryValue > 0) {
      breakdown.push({ category: "Personal Jewelry", amount: jewelryValue, zakatOn: isAboveNisab ? jewelryValue * ZAKAT_RATE : 0 });
    }
    if (retirementValue > 0) {
      breakdown.push({ category: "Retirement Accounts (1/3 zakatable)", amount: retirementValue, zakatOn: isAboveNisab ? retirementValue * ZAKAT_RATE : 0 });
    }

    // Deduction rows
    if (madhab !== "shafii") {
      breakdown.push({ category: "Debts Owed", amount: -assets.debtsOwed, zakatOn: 0 });
    }
    if (madhab === "hanafi" && assets.livingExpenses > 0) {
      breakdown.push({ category: "Living Expenses", amount: -assets.livingExpenses, zakatOn: 0 });
    }
  }

  return {
    totalAssets,
    totalDeductions,
    netWorth,
    nisabThreshold,
    nisabStandard: effectiveNisabStandard,
    zakatDue,
    isAboveNisab,
    breakdown,
    isJafari,
  };
}
