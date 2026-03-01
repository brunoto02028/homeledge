/**
 * Stripe fee calculation utility.
 * Calculates the amount to charge the customer so the net amount
 * received after Stripe fees matches the desired base price.
 *
 * Formula: chargeAmount = (baseAmount + fixedFee) / (1 - percentageFee)
 *
 * Default Stripe UK fees:
 * - European cards: 1.5% + £0.20
 * - Non-European cards: 2.5% + £0.20
 */

/** Fee configuration — can be overridden via environment variables. */
export interface StripeFeeConfig {
  /** Percentage fee as a decimal (e.g. 0.015 for 1.5%) */
  percentageFee: number;
  /** Fixed fee in pence (e.g. 20 for £0.20) */
  fixedFeePence: number;
}

/** Default fee config for European cards (UK standard). */
export const DEFAULT_FEE_CONFIG: StripeFeeConfig = {
  percentageFee: parseFloat(process.env.STRIPE_FEE_PERCENT || '0.015'),
  fixedFeePence: parseInt(process.env.STRIPE_FEE_FIXED_PENCE || '20', 10),
};

/**
 * Calculate the amount to charge the customer (in pence) so that
 * after Stripe deducts fees, the net amount equals basePence.
 *
 * @param basePence - The desired net amount in pence (what you want to receive)
 * @param config - Optional fee config override
 * @returns The amount to charge in pence (rounded up to nearest penny)
 */
export function calculateChargeAmount(
  basePence: number,
  config: StripeFeeConfig = DEFAULT_FEE_CONFIG,
): number {
  if (basePence <= 0) return 0;
  const charge = (basePence + config.fixedFeePence) / (1 - config.percentageFee);
  return Math.ceil(charge);
}

/**
 * Calculate the Stripe fee portion for a given base price.
 *
 * @param basePence - The desired net amount in pence
 * @param config - Optional fee config override
 * @returns The fee amount in pence
 */
export function calculateFeeAmount(
  basePence: number,
  config: StripeFeeConfig = DEFAULT_FEE_CONFIG,
): number {
  const charge = calculateChargeAmount(basePence, config);
  return charge - basePence;
}

/**
 * Format pence as a GBP string (e.g. 831 → "£8.31").
 */
export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/**
 * Get the charge amount for a plan (base price + Stripe fee).
 *
 * @param planBasePence - The plan's base price in pence
 * @returns Object with base, fee, charge amounts in pence and formatted strings
 */
export function getPlanPricing(planBasePence: number) {
  const charge = calculateChargeAmount(planBasePence);
  const fee = charge - planBasePence;
  return {
    basePence: planBasePence,
    feePence: fee,
    chargePence: charge,
    baseFormatted: formatPence(planBasePence),
    feeFormatted: formatPence(fee),
    chargeFormatted: formatPence(charge),
  };
}
