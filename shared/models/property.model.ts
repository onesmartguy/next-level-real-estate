import { z } from 'zod';

/**
 * Comparable property (comp) data
 */
export const CompSchema = z.object({
  address: z.string(),
  distance: z.number(),
  soldPrice: z.number(),
  soldDate: z.date(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFeet: z.number(),
  pricePerSqFt: z.number(),
  daysOnMarket: z.number().optional(),
  similarity: z.number().min(0).max(1).optional(),
});

/**
 * Property valuation data
 */
export const ValuationSchema = z.object({
  estimatedValue: z.number(),
  lowEstimate: z.number(),
  highEstimate: z.number(),
  confidence: z.enum(['high', 'medium', 'low']),
  valuationDate: z.date(),
  valuationMethod: z.enum(['automated', 'manual', 'appraisal', 'cma']),
  dataSource: z.string().optional(),
  comps: z.array(CompSchema).optional(),
});

/**
 * After Repair Value (ARV) calculation
 */
export const ARVSchema = z.object({
  arv: z.number(),
  estimatedRepairCost: z.number(),
  repairContingency: z.number().default(0.1),
  totalRepairCost: z.number(),
  calculatedAt: z.date(),
  confidenceLevel: z.enum(['high', 'medium', 'low']),
  assumptions: z.string().optional(),
});

/**
 * Investment analysis for wholesale
 */
export const InvestmentAnalysisSchema = z.object({
  maxAllowableOffer: z.number(),
  targetProfitMargin: z.number().default(0.15),
  wholesaleFee: z.number(),
  buyerPrice: z.number(),
  holdingCosts: z.number().optional(),
  closingCosts: z.number().optional(),
  projectedROI: z.number().optional(),
  profitPotential: z.enum(['excellent', 'good', 'fair', 'poor']),
  dealScore: z.number().min(0).max(100).optional(),
});

/**
 * Market conditions data
 */
export const MarketConditionsSchema = z.object({
  medianPrice: z.number(),
  averageDaysOnMarket: z.number(),
  pricePerSqFt: z.number(),
  inventory: z.number().optional(),
  marketTrend: z.enum(['hot', 'warm', 'neutral', 'cool', 'cold']),
  demandLevel: z.enum(['very_high', 'high', 'moderate', 'low', 'very_low']),
  absorptionRate: z.number().optional(),
  priceAppreciation: z.number().optional(),
  lastUpdated: z.date(),
});

/**
 * Property details and condition
 */
export const PropertyDetailsSchema = z.object({
  parcelId: z.string().optional(),
  legalDescription: z.string().optional(),
  zoning: z.string().optional(),
  taxAssessedValue: z.number().optional(),
  annualTaxes: z.number().optional(),
  hoaFees: z.number().optional(),
  utilities: z.record(z.boolean()).optional(),
  parking: z.string().optional(),
  garage: z.number().optional(),
  stories: z.number().optional(),
  foundation: z.string().optional(),
  roof: z.string().optional(),
  heating: z.string().optional(),
  cooling: z.string().optional(),
  flooring: z.string().optional(),
  appliances: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

/**
 * Repair and renovation estimates
 */
export const RepairItemSchema = z.object({
  category: z.enum(['structural', 'roof', 'hvac', 'plumbing', 'electrical', 'cosmetic', 'flooring', 'kitchen', 'bathroom', 'exterior', 'other']),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  estimatedCost: z.number(),
  notes: z.string().optional(),
});

export const RepairEstimateSchema = z.object({
  items: z.array(RepairItemSchema),
  totalEstimate: z.number(),
  contingency: z.number(),
  grandTotal: z.number(),
  estimatedBy: z.string().optional(),
  estimatedAt: z.date(),
  confidence: z.enum(['high', 'medium', 'low']),
});

/**
 * Main Property model
 * Extended property data with valuation and investment analysis
 */
export const PropertySchema = z.object({
  // Primary identifiers
  propertyId: z.string(),
  leadId: z.string().optional(),

  // Basic information
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  county: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Property characteristics
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse', 'land', 'commercial', 'other']),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number().optional(),
  lotSize: z.number().optional(),
  yearBuilt: z.number().optional(),

  // Condition and details
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']).optional(),
  details: PropertyDetailsSchema.optional(),

  // Valuation
  currentValuation: ValuationSchema.optional(),
  valuationHistory: z.array(ValuationSchema).default([]),

  // Investment analysis
  arv: ARVSchema.optional(),
  investmentAnalysis: InvestmentAnalysisSchema.optional(),
  repairEstimate: RepairEstimateSchema.optional(),

  // Market data
  marketConditions: MarketConditionsSchema.optional(),

  // Ownership
  ownerName: z.string().optional(),
  ownerOccupied: z.boolean().optional(),
  mortgageBalance: z.number().optional(),
  equity: z.number().optional(),

  // Strategy fit
  wholesalePotential: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']).optional(),
  fixAndFlipPotential: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']).optional(),
  rentalPotential: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']).optional(),

  // Metadata
  notes: z.string().optional(),
  images: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([]),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export type Comp = z.infer<typeof CompSchema>;
export type Valuation = z.infer<typeof ValuationSchema>;
export type ARV = z.infer<typeof ARVSchema>;
export type InvestmentAnalysis = z.infer<typeof InvestmentAnalysisSchema>;
export type MarketConditions = z.infer<typeof MarketConditionsSchema>;
export type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;
export type RepairItem = z.infer<typeof RepairItemSchema>;
export type RepairEstimate = z.infer<typeof RepairEstimateSchema>;
export type Property = z.infer<typeof PropertySchema>;

/**
 * MongoDB collection name
 */
export const PROPERTY_COLLECTION = 'properties';

/**
 * MongoDB indexes
 */
export const PROPERTY_INDEXES = [
  { key: { propertyId: 1 }, unique: true },
  { key: { leadId: 1 } },
  { key: { address: 1, city: 1, state: 1 } },
  { key: { zipCode: 1 } },
  { key: { latitude: 1, longitude: 1 } },
  { key: { wholesalePotential: 1, createdAt: -1 } },
  { key: { 'investmentAnalysis.dealScore': -1 } },
  { key: { createdAt: -1 } },
];
