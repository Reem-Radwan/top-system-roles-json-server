// ── MOCK DATA ──

function generateUnits(prefix, count) {
  const unitTypes     = ["Apartment", "Villa", "Townhouse", "Studio", "Penthouse", "Duplex"];
  const phases        = ["Phase 1", "Phase 2", "Phase 3"];
  const statuses      = ["Available", "Sold", "Reserved", "Under Offer"];
  const salesmen      = ["Ahmed Hassan", "Sara El-Din", "Mohamed Ali", "Nour Khalil", "Rania Samir", "Karim Farouk"];
  const floors        = ["Ground", "1st", "2nd", "3rd", "4th", "5th", "Rooftop"];
  const bedsArr       = ["Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR"];
  const deliveryYears = ["2024", "2025", "2026", "2027"];
  const units = [];
  // Use a seeded-like approach for reproducible data
  let seed = prefix.charCodeAt(0) * 31 + count;
  function rand() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(seed) / 0xffffffff;
  }
  for (let i = 1; i <= count; i++) {
    const unitType   = unitTypes[Math.floor(rand() * unitTypes.length)];
    const grossArea  = Math.round(80 + rand() * 320);
    const landArea   = (unitType === "Villa" || unitType === "Townhouse")
                       ? Math.round(150 + rand() * 400) : null;
    const basePrice  = Math.round((grossArea * (5000 + rand() * 3000)) / 1000) * 1000;
    const discountPct = rand() < 0.3 ? Math.round(rand() * 10) : 0;
    const salesPrice = Math.round(basePrice * (1 - discountPct / 100) / 1000) * 1000;

    units.push({
      unit_code:     `${prefix.substring(0,2).toUpperCase()}-${String(i).padStart(3,"0")}`,
      phase:         phases[Math.floor(rand() * phases.length)],
      unit_type:     unitType,
      status:        statuses[Math.floor(rand() * statuses.length)],
      salesman:      rand() < 0.3 ? null : salesmen[Math.floor(rand() * salesmen.length)],
      floor:         floors[Math.floor(rand() * floors.length)],
      beds:          bedsArr[Math.floor(rand() * bedsArr.length)],
      delivery_year: deliveryYears[Math.floor(rand() * deliveryYears.length)],
      gross_area:    grossArea,
      land_area:     landArea,
      base_price:    basePrice,
      sales_price:   salesPrice,
      discount:      discountPct,
    });
  }
  return units;
}

const COMMON_FIELDS = [
  { name: "unit_code",     label: "Unit Code",        type: "string" },
  { name: "phase",         label: "Phase",            type: "string" },
  { name: "unit_type",     label: "Unit Type",        type: "string" },
  { name: "status",        label: "Status",           type: "string" },
  { name: "salesman",      label: "Salesman",         type: "string" },
  { name: "floor",         label: "Floor",            type: "string" },
  { name: "beds",          label: "Bedrooms",         type: "string" },
  { name: "delivery_year", label: "Delivery Year",    type: "string" },
  { name: "gross_area",    label: "Gross Area (m²)",  type: "number" },
  { name: "land_area",     label: "Land Area (m²)",   type: "number" },
  { name: "base_price",    label: "Base Price",       type: "number" },
  { name: "sales_price",   label: "Sales Price",      type: "number" },
  { name: "discount",      label: "Discount (%)",     type: "number" },
];

export const MOCK = {
  mint: {
    company: { name: "Mint Developments" },
    count: 120,
    fields: COMMON_FIELDS,
    units: generateUnits("Mint", 120),
  },
  palmier: {
    company: { name: "Palmier Developments" },
    count: 85,
    fields: COMMON_FIELDS,
    units: generateUnits("Palmier", 85),
  },
  igi: {
    company: { name: "IGI Developments" },
    count: 150,
    fields: COMMON_FIELDS,
    units: generateUnits("IGI", 150),
  },
};