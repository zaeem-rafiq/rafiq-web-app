export type Madhab = "Hanafi" | "Shafi'i" | "Maliki" | "Hanbali" | "Ja'fari";
export type NisabStandard = "gold" | "silver";

export interface ZakatAssets {
  cash: number;
  gold: number;       // grams
  silver: number;     // grams
  investments: number;
  businessInventory: number;
  debtsOwed: number;
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
  khums?: {
    applicable: boolean;
    rate: number;
    categories: string[];
  };
}

const NISAB_GOLD_GRAMS = 85;   // 85 grams of gold
const NISAB_SILVER_GRAMS = 595; // 595 grams of silver
const ZAKAT_RATE = 0.025;       // 2.5%
const KHUMS_RATE = 0.20;        // 20%

export function calculateZakat(
  assets: ZakatAssets,
  madhab: Madhab,
  prices: MetalPrices,
  nisabStandard: NisabStandard = "gold"
): ZakatResult {
  const isJafari = madhab === "Ja'fari";

  // Calculate asset values
  const goldValue = assets.gold * prices.goldPerGram;
  const silverValue = assets.silver * prices.silverPerGram;

  const totalAssets = assets.cash + goldValue + silverValue + assets.investments + assets.businessInventory;
  const totalDeductions = assets.debtsOwed;
  const netWorth = totalAssets - totalDeductions;

  // Determine Nisab
  let effectiveNisabStandard = nisabStandard;
  if (madhab === "Hanafi") {
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
    // Ja'fari: Zakat only on gold, silver, livestock, crops
    // Cash & investments fall under Khums
    const zakatableGold = goldValue;
    const zakatableSilver = silverValue;
    const zakatOnGoldSilver = isAboveNisab ? (zakatableGold + zakatableSilver) * ZAKAT_RATE : 0;

    breakdown.push(
      { category: "Gold", amount: goldValue, zakatOn: isAboveNisab ? goldValue * ZAKAT_RATE : 0 },
      { category: "Silver", amount: silverValue, zakatOn: isAboveNisab ? silverValue * ZAKAT_RATE : 0 },
      { category: "Cash (Khums)", amount: assets.cash, zakatOn: assets.cash * KHUMS_RATE },
      { category: "Investments (Khums)", amount: assets.investments, zakatOn: assets.investments * KHUMS_RATE },
      { category: "Business Inventory (Khums)", amount: assets.businessInventory, zakatOn: assets.businessInventory * KHUMS_RATE },
      { category: "Debts Owed", amount: -assets.debtsOwed, zakatOn: 0 },
    );

    zakatDue = zakatOnGoldSilver +
      (assets.cash + assets.investments + assets.businessInventory) * KHUMS_RATE;
  } else {
    // Standard Sunni calculation
    if (isAboveNisab) {
      zakatDue = netWorth * ZAKAT_RATE;
    }

    breakdown.push(
      { category: "Cash & Bank Accounts", amount: assets.cash, zakatOn: isAboveNisab ? assets.cash * ZAKAT_RATE : 0 },
      { category: "Gold", amount: goldValue, zakatOn: isAboveNisab ? goldValue * ZAKAT_RATE : 0 },
      { category: "Silver", amount: silverValue, zakatOn: isAboveNisab ? silverValue * ZAKAT_RATE : 0 },
      { category: "Investments", amount: assets.investments, zakatOn: isAboveNisab ? assets.investments * ZAKAT_RATE : 0 },
      { category: "Business Inventory", amount: assets.businessInventory, zakatOn: isAboveNisab ? assets.businessInventory * ZAKAT_RATE : 0 },
      { category: "Debts Owed", amount: -assets.debtsOwed, zakatOn: 0 },
    );
  }

  return {
    totalAssets,
    totalDeductions: assets.debtsOwed,
    netWorth,
    nisabThreshold,
    nisabStandard: effectiveNisabStandard,
    zakatDue,
    isAboveNisab,
    breakdown,
    isJafari,
    khums: isJafari
      ? {
          applicable: true,
          rate: KHUMS_RATE,
          categories: ["Cash", "Investments", "Business Inventory"],
        }
      : undefined,
  };
}
