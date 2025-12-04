// Product Type Standardization Mapping
// Maps Excel variations to database enum values

const PRODUCT_TYPE_MAP = {
  // Exact matches
  "RELOCATION": "RELOCATION",
  "Relocation": "RELOCATION",
  "CONTRACT": "CONTRACT", 
  "Contract": "CONTRACT",
  "SPP": "SPP",
  "spp": "SPP",
  "MLU": "MIDLIFE_UPGRADE",
  "Midlife Upgrade": "MIDLIFE_UPGRADE",
  "RETROFIT": "RETROFIT_KIT",
  "Retrofit kit": "RETROFIT_KIT",
  "Upgrade": "UPGRADE_KIT",
  "Upgrade kit": "UPGRADE_KIT",
  "BD Charges": "BD_CHARGES",
  "BD Spare": "BD_SPARE",
  
  // Spelling corrections
  "Ccontarct": "CONTRACT",
  "Contarct": "CONTRACT"
};

function normalizeProductType(excelProductType) {
  if (!excelProductType) return null;
  
  const normalized = PRODUCT_TYPE_MAP[excelProductType.trim()];
  if (normalized) {
    return normalized;
  }
  
  // Log unknown types for manual review
  console.warn(`Unknown product type: "${excelProductType}"`);
  return "OTHER"; // Default fallback
}

module.exports = { normalizeProductType, PRODUCT_TYPE_MAP };
