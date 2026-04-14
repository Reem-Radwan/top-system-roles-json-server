import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001' });

// ── Fields metadata — kept static since JSON Server has no schema endpoint ───
// Field names match exactly what db.json units return
export const REPORT_FIELDS = [
  { name: "unit_code",                 label: "Unit Code",          type: "string" },
  { name: "sales_phasing",             label: "Phase",              type: "string" },
  { name: "building_type",             label: "Building Type",      type: "string" },
  { name: "unit_type",                 label: "Unit Type",          type: "string" },
  { name: "status",                    label: "Status",             type: "string" },
  { name: "num_bedrooms",              label: "Bedrooms",           type: "string" },
  { name: "finishing_specs",           label: "Finishing",          type: "string" },
  { name: "development_delivery_date", label: "Delivery Date",      type: "string" },
  { name: "sellable_area",             label: "Sellable Area (m²)", type: "number" },
  { name: "land_area",                 label: "Land Area (m²)",     type: "number" },
  { name: "interest_free_unit_price",  label: "Base Price",         type: "number" },
  { name: "sales_value",               label: "Sales Price",        type: "number" },
];

// ── 1. Fetch all companies ────────────────────────────────────────────────────
export async function getCompanies() {
  const res = await API.get('/companies');
  return res.data; // [{ id, name }, ...]
}

// ── 2. Fetch all units for a given company_id ─────────────────────────────────
export async function getUnitsByCompany(companyId) {
  const res = await API.get('/units', { params: { company_id: companyId } });
  return res.data; // [{ unit_code, status, sales_phasing, ... }, ...]
}