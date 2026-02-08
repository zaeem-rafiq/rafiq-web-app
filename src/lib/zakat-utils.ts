export type Madhab = "Hanafi" | "Shafi'i" | "Maliki" | "Hanbali" | "Ja'fari";
export type NisabStandard = "gold" | "silver";

export interface ZakatAssets {
  cash: number;
  gold: number;       // grams
  silver: number;     // grams
  investments: number;
  businessInventory: number;
  livestock: number;  // USD value
  crops: number;      // USD value
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
}

const NISAB_GOLD_GRAMS = 85;   // 85 grams of gold
const NISAB_SILVER_GRAMS = 595; // 595 grams of silver
const ZAKAT_RATE = 0.025;       // 2.5%

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

  const totalAssets = isJafari
    ? goldValue + silverValue + assets.livestock + assets.crops
    : assets.cash + goldValue + silverValue + assets.investments + assets.businessInventory;
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
    // Ja'fari: Zakat applies only to gold, silver, livestock, and crops
    // Cash & investments fall under Khums (handled in the Khums tab)
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
  };
}
