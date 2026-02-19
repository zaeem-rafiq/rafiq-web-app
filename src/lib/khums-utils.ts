// Khums Calculation Engine — ported from iOS KhumsCalculationEngine.swift
// Khums = 20% of annual surplus (net income − living expenses)
// Applies to Ja'fari (Shia) Muslims

export const KHUMS_RATE = 0.20;
export const SAHM_AL_IMAM_RATE = 0.50;
export const SAHM_AL_SADAT_RATE = 0.50;

export interface KhumsInput {
  // Income sources
  savings: number;
  cashOnHand: number;
  investments: number;
  businessProfits: number;
  rentalIncome: number;
  gifts: number;
  inheritance: number; // EXEMPT from khums

  // Property subject to khums
  goldSilverPurchased: number;
  jewelryBeyondUse: number;
  unusedGoods: number;

  // Deductions
  annualExpenses: number;
  debtPayments: number;
  businessReinvestment: number;

  // Advanced categories (each taxed independently at 20%)
  kanz: number;          // Treasure trove
  madan: number;         // Minerals/mining
  ghaws: number;         // Sea/diving finds
  propertyAppreciation: number;
  mixedHalalHaram: number;
}

export interface KhumsResult {
  totalIncome: number;
  totalProperty: number;
  grossSurplus: number;
  totalDeductions: number;
  netSurplus: number;
  standardKhums: number;
  advancedKhums: number;
  totalKhumsObligation: number;
  sahmAlImam: number;
  sahmAlSadat: number;
}

export function createEmptyKhumsInput(): KhumsInput {
  return {
    savings: 0,
    cashOnHand: 0,
    investments: 0,
    businessProfits: 0,
    rentalIncome: 0,
    gifts: 0,
    inheritance: 0,
    goldSilverPurchased: 0,
    jewelryBeyondUse: 0,
    unusedGoods: 0,
    annualExpenses: 0,
    debtPayments: 0,
    businessReinvestment: 0,
    kanz: 0,
    madan: 0,
    ghaws: 0,
    propertyAppreciation: 0,
    mixedHalalHaram: 0,
  };
}

export function calculateKhums(input: KhumsInput): KhumsResult {
  // Total income — inheritance is EXEMPT
  const totalIncome =
    input.savings +
    input.cashOnHand +
    input.investments +
    input.businessProfits +
    input.rentalIncome +
    input.gifts;
  // Note: inheritance intentionally excluded

  // Total property subject to khums
  const totalProperty =
    input.goldSilverPurchased +
    input.jewelryBeyondUse +
    input.unusedGoods;

  // Gross surplus = income + property
  const grossSurplus = totalIncome + totalProperty;

  // Total deductions
  const totalDeductions =
    input.annualExpenses +
    input.debtPayments +
    input.businessReinvestment;

  // Net surplus (cannot be negative)
  const netSurplus = Math.max(0, grossSurplus - totalDeductions);

  // Standard khums = 20% of net surplus
  const standardKhums = netSurplus * KHUMS_RATE;

  // Advanced categories — each taxed independently at 20%
  const advancedKhums =
    (input.kanz * KHUMS_RATE) +
    (input.madan * KHUMS_RATE) +
    (input.ghaws * KHUMS_RATE) +
    (input.propertyAppreciation * KHUMS_RATE) +
    (input.mixedHalalHaram * KHUMS_RATE);

  // Total obligation
  const totalKhumsObligation = standardKhums + advancedKhums;

  // 50/50 split on TOTAL obligation
  const sahmAlImam = totalKhumsObligation * SAHM_AL_IMAM_RATE;
  const sahmAlSadat = totalKhumsObligation * SAHM_AL_SADAT_RATE;

  return {
    totalIncome,
    totalProperty,
    grossSurplus,
    totalDeductions,
    netSurplus,
    standardKhums,
    advancedKhums,
    totalKhumsObligation,
    sahmAlImam,
    sahmAlSadat,
  };
}
