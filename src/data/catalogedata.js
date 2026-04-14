// ── Shared brochure image sets (identical to masterplansdata.js) ──────────────
const brochureImages = {
  villa: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  ],
  apartment: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  ],
  chalet: [
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&q=80",
  ],
};

export const mockCompanies = [
  { id: 1, name: "Mint" },
  { id: 2, name: "Palmier Developments" },
  { id: 3, name: "IGI Developments" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: does unit code exist as a pin in masterplansdata?
//   Golden Hills  (101) → SUN-001, SUN-002, SUN-GEN-100…SUN-GEN-125
//   Skyline Towers(201) → URB-BLK-A…URB-BLK-L  (building pins)
//   Blue Lagoon   (301) → SEA-505…SEA-530
//
// For building-type projects the individual unit (e.g. URB-101) lives inside
// a building pin (URB-BLK-A). We still set map_focus_code = unit_code so the
// masterplan "reopen_unit" logic can find the parent building and open it.
// ─────────────────────────────────────────────────────────────────────────────

export const mockUnits = [
  // ── COMPANY 1 · Mint / Golden Hills ────────────────────────────────────────

  {
    unit_code: "SUN-001",
    company_id: 1,
    project: "Golden Hills",
    project_id: 101,
    status: "Blocked",
    sales_phasing: "Phase 1",
    num_bedrooms: "4",
    building_type: "Villa",
    unit_type: "Standalone",
    unit_model: "Luxury",
    development_delivery_date: "2026-06-01",
    finishing_specs: "Luxury",
    sellable_area: 350.0,
    garden_area: 150.0,
    land_area: 500.0,
    penthouse_area: 50.0,
    roof_terraces_area: 80.0,
    interest_free_unit_price: 15000000,
    // Synced: masterplansdata unitDetails["SUN-001"].data.layout_images = brochureImages.villa
    layout_images: brochureImages.villa,
    // Synced: unit_code matches unitPositions[101] id=1 unit_code "SUN-001"
    map_focus_code: "SUN-001",
  },
  {
    unit_code: "SUN-002",
    company_id: 1,
    project: "Golden Hills",
    project_id: 101,
    status: "Reserved",
    sales_phasing: "Phase 1",
    num_bedrooms: "3",
    building_type: "Townhouse",
    unit_type: "Corner",
    unit_model: "Classic",
    development_delivery_date: "2026-06-01",
    finishing_specs: "Premium",
    sellable_area: 280.0,
    garden_area: 100.0,
    land_area: 300.0,
    penthouse_area: 0,
    roof_terraces_area: 40.0,
    interest_free_unit_price: 11000000,
    // Synced: masterplansdata unitDetails["SUN-002"].data.layout_images = []
    layout_images: [],
    map_focus_code: "SUN-002",
  },

  // ── COMPANY 2 · Palmier Developments / Skyline Towers ─────────────────────

  {
    unit_code: "URB-101",
    company_id: 2,
    project: "Skyline Towers",
    project_id: 201,
    status: "Available",
    sales_phasing: "Launch",
    num_bedrooms: "2",
    building_type: "Apartment",
    unit_type: "Typical Floor",
    unit_model: "Modern",
    development_delivery_date: "2025-12-01",
    finishing_specs: "Ultra",
    sellable_area: 120.0,
    garden_area: 0,
    land_area: 0,
    penthouse_area: 0,
    roof_terraces_area: 0,
    interest_free_unit_price: 4500000,
    // Synced: masterplansdata unitDetails["URB-101"].data.layout_images = brochureImages.apartment
    layout_images: brochureImages.apartment,
    // URB-101 lives inside building pin URB-BLK-A → map_focus_code = "URB-101"
    // masterplan reopen logic will find URB-BLK-A and open the building tooltip
    map_focus_code: "URB-101",
  },
  {
    unit_code: "URB-102",
    company_id: 2,
    project: "Skyline Towers",
    project_id: 201,
    status: "Sold",
    sales_phasing: "Launch",
    num_bedrooms: "3",
    building_type: "Apartment",
    unit_type: "Typical Floor",
    unit_model: "Modern",
    development_delivery_date: "2025-12-01",
    finishing_specs: "Fully Finished",
    sellable_area: 160.0,
    garden_area: 0,
    land_area: 0,
    penthouse_area: 0,
    roof_terraces_area: 0,
    interest_free_unit_price: 6200000,
    // Synced: masterplansdata unitDetails["URB-102"].data.layout_images = []
    layout_images: [],
    map_focus_code: "URB-102",
  },

  // ── COMPANY 3 · IGI Developments / Blue Lagoon ────────────────────────────

  {
    unit_code: "SEA-505",
    company_id: 3,
    project: "Blue Lagoon",
    project_id: 301,
    status: "UNReleased",
    sales_phasing: "Phase 2",
    num_bedrooms: "2",
    building_type: "Chalet",
    unit_type: "Ground",
    unit_model: "Beach House",
    development_delivery_date: "2027-08-01",
    finishing_specs: "Finished",
    sellable_area: 110.0,
    garden_area: 60.0,
    land_area: 0,
    penthouse_area: 0,
    roof_terraces_area: 0,
    interest_free_unit_price: 7500000,
    // Synced: masterplansdata unitDetails["SEA-505"].data.layout_images = []
    layout_images: [],
    map_focus_code: "SEA-505",
  },
];

// ─── GENERATED BULK DATA ──────────────────────────────────────────────────────

// ── Golden Hills generated villas (SUN-GEN-100 … SUN-GEN-125) ────────────────
// masterplansdata: layout_images = i % 3 === 0 ? brochureImages.villa : []
//                  i = 0 → SUN-GEN-100, i=1 → SUN-GEN-101, ...
for (let i = 0; i < 26; i++) {
  const code   = `SUN-GEN-${100 + i}`;
  const isSold = i % 5 === 2;
  mockUnits.push({
    unit_code:   code,
    company_id:  1,
    project:     "Golden Hills",
    project_id:  101,
    status:      isSold ? "Sold" : "Available",
    sales_phasing: `Phase ${Math.floor(i / 10) + 1}`,
    num_bedrooms: "4",
    building_type: "Villa",
    unit_type:   "Standalone",
    unit_model:  "Luxury",
    development_delivery_date: "2026-12-01",
    finishing_specs: "Core & Shell",
    sellable_area:   300 + i * 2,
    garden_area:     100 + i,
    land_area:       400 + i,
    penthouse_area:  0,
    roof_terraces_area: 40,
    interest_free_unit_price: 12000000 + i * 100000,
    // Synced: same condition as masterplansdata
    layout_images: i % 3 === 0 ? brochureImages.villa : [],
    // Pin exists in unitPositions[101] for indices 0-25 (ids 3-28)
    map_focus_code: code,
  });
}

// ── Skyline Towers generated apartments (URB-GEN-100 … URB-GEN-149) ──────────
// masterplansdata: layout_images = i % 5 === 0 ? brochureImages.apartment : []
// Pins: URB-GEN-100…URB-GEN-128 exist inside building blocks B-L in unitPositions[201]
//       URB-GEN-129…URB-GEN-149 have no pin in unitPositions
for (let i = 0; i < 50; i++) {
  const code = `URB-GEN-${100 + i}`;
  // URB-GEN-100..128 are in unitPositions → map enabled
  // URB-GEN-129..149 are NOT in unitPositions → map disabled
  const hasMasterplanPin = i <= 28;
  mockUnits.push({
    unit_code:   code,
    company_id:  2,
    project:     "Skyline Towers",
    project_id:  hasMasterplanPin ? 201 : null,
    status:      "UNReleased",
    sales_phasing: "Tower A",
    num_bedrooms: i % 2 === 0 ? "2" : "3",
    building_type: "Apartment",
    unit_type:   "Flat",
    unit_model:  "Standard",
    development_delivery_date: "2025-06-01",
    finishing_specs: "Fully Finished",
    sellable_area:   100 + i,
    garden_area:     0,
    land_area:       0,
    penthouse_area:  0,
    roof_terraces_area: 0,
    interest_free_unit_price: 3000000 + i * 50000,
    // Synced: same condition as masterplansdata for URB single units
    layout_images: i % 5 === 0 ? brochureImages.apartment : [],
    map_focus_code: hasMasterplanPin ? code : null,
  });
}

// ── Blue Lagoon generated chalets (SEA-506 … SEA-530) ────────────────────────
// masterplansdata: layout_images = (i - 505) % 4 === 0 ? brochureImages.chalet : []
//                  i = 506..530
for (let i = 506; i <= 530; i++) {
  const code       = `SEA-${i}`;
  const isReserved = i % 7 === 0;
  const offset     = i - 505; // 1..25
  mockUnits.push({
    unit_code:   code,
    company_id:  3,
    project:     "Blue Lagoon",
    project_id:  301,
    status:      isReserved ? "Reserved" : "Available",
    sales_phasing: "Phase 2",
    num_bedrooms: i % 2 === 0 ? "2" : "3",
    building_type: "Chalet",
    unit_type:   "Ground",
    unit_model:  "Beach House",
    development_delivery_date: "2027-08-01",
    finishing_specs: "Finished",
    sellable_area:   110 + offset,
    garden_area:     60,
    land_area:       0,
    penthouse_area:  0,
    roof_terraces_area: 0,
    interest_free_unit_price: 7500000 + offset * 200000,
    // Synced: same condition as masterplansdata
    layout_images: offset % 4 === 0 ? brochureImages.chalet : [],
    // All SEA-506..530 have pins in unitPositions[301]
    map_focus_code: code,
  });
}















