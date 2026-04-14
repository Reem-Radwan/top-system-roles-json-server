// inventoryhubdata.js
// Mock data replacing Django template context variables

export const IS_UPLOADER = false;
export const LOCKED_COMPANY_ID = "";
export const LOCKED_COMPANY_NAME = "";

export const companies = [
  { id: "1", name: "Mint" },
  { id: "2", name: "Palmier Developments" },
  { id: "3", name: "IGI Developments" },
  { id: "4", name: "Delta Distribution Group" },
];

// Keyed by company id — mirrors Django's company_configs context variable
export const companyConfigs = {
  "1": {
    has_sheets: true,
    has_erp: true,
    sheet_url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
    erp_url: "https://erp.alpha-logistics.com/api/v2/inventory/units",
  },
  "2": {
    has_sheets: true,
    has_erp: false,
    sheet_url: "https://docs.google.com/spreadsheets/d/2CyiNWt1YSB6oGNLvCeCaakhnVrqumlct85PhWF3vqnt",
    erp_url: null,
  },
  "3": {
    has_sheets: false,
    has_erp: true,
    sheet_url: null,
    erp_url: "https://erp.gamma-storage.io/api/inventory",
  },
  "4": {
    has_sheets: false,
    has_erp: false,
    sheet_url: null,
    erp_url: null,
  },
};

// Simulated async API responses — replace with real fetch() calls
export const mockApiResponses = {
  triggerImport: (sourceType) =>
    new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.15) {
          resolve({
            success: true,
            stats: {
              total_received: Math.floor(Math.random() * 500) + 50,
              created: Math.floor(Math.random() * 200) + 10,
              updated: Math.floor(Math.random() * 100) + 5,
              skipped: Math.floor(Math.random() * 30),
              errors:
                Math.random() > 0.7
                  ? ["Row 12: Invalid unit code format", "Row 45: Duplicate entry detected"]
                  : [],
            },
          });
        } else {
          resolve({ success: false, error: `${sourceType.toUpperCase()} endpoint returned 503.` });
        }
      }, 1400);
    }),

  triggerRename: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve({
            success: true,
            stats: {
              renamed: Math.floor(Math.random() * 80) + 5,
              skipped_not_found: Math.floor(Math.random() * 10),
              skipped_duplicate: Math.floor(Math.random() * 5),
              errors: [],
            },
          });
        } else {
          resolve({ success: false, error: "CSV parsing failed: unexpected column header." });
        }
      }, 1200);
    }),

  executeDelete: (unitCodes) =>
    new Promise((resolve) => {
      setTimeout(() => {
        const found = Math.floor(unitCodes.length * (0.7 + Math.random() * 0.3));
        resolve({
          success: true,
          deleted_count: found,
          not_found_count: unitCodes.length - found,
        });
      }, 900);
    }),
};