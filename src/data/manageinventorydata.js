// ─── ManageInventoryData.js ──────────────────────────────────────────────────
// Mock real-estate data for Manage Inventory (replaces Django back-end)

export const mockCompanies = [
  { id: 1, name: "Mint" },
  { id: 2, name: "Palmier Developments" },
  { id: 3, name: "IGI Developments" },
];

// ── helpers ──────────────────────────────────────────────────────────────────
const STATUS_OPTS = [
  "Available","Blocked Development","Blocked Sales",
  "Blocked Cancelation","Contracted","Hold","Partner","Reserved","Unreleased",
];
const rand  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rInt  = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const rDate = (y0, y1) => {
  const d = new Date(y0, 0, 1);
  const e = new Date(y1, 11, 31);
  return new Date(d.getTime() + Math.random() * (e.getTime() - d.getTime()))
    .toISOString().split("T")[0];
};
const fmt = (n) => Math.round(n);

// ── reference data ────────────────────────────────────────────────────────────
const PROJECTS = {
  "Mint": [
    { name: "The Village",           city: "New Cairo"       },
    { name: "Palm Parks",            city: "Sheikh Zayed"    },
    { name: "Palm Hills Katameya",   city: "New Cairo"       },
    { name: "Badya",                 city: "6th October"     },
  ],
  "Palmier Developments": [
    { name: "Villette",              city: "New Cairo"       },
    { name: "The Estates",           city: "Sheikh Zayed"    },
    { name: "SODIC East",            city: "New Cairo"       },
    { name: "Zoe",                   city: "North Coast"     },
  ],
  "IGI Developments": [
    { name: "iCity",                 city: "New Cairo"       },
    { name: "Mountain View Hyde Park",city:"New Cairo"       },
    { name: "Mountain View Ras El Hekma", city:"North Coast" },
  ],
};

const UNIT_TYPES  = ["Apartment","Villa","Town House","Twin House","Penthouse","Chalet"];
const FLOORS      = ["Ground","1st","2nd","3rd","4th","5th","Roof"];
const VIEWS       = ["Garden","Pool","Street","Lake","Sea","Landscape","Park"];
const FINISHING   = ["Standard","Premium","Super Lux","Core & Shell"];
const OWNERS      = [
  "Ahmed Hassan","Mohamed Ali","Sara Ibrahim","Khaled Mahmoud",
  "Nour Abdel Aziz","Yasmin Farouk","Omar Samir","Dina Youssef",
  "Tarek Mansour","Hana Elgamal","Sherif Naguib","Rania Kamal",
];
const BROKERS     = ["Coldwell Banker","ERA Egypt","Engel & Völkers","Re/Max Egypt",null,null];
const CONTRACTORS = ["ACC","Hassan Allam","El Sharkawi","Orascom Construction",null];

// ── unit generator ────────────────────────────────────────────────────────────
let uid = 1;
const generateUnits = () => {
  const units = [];

  Object.entries(PROJECTS).forEach(([company, projList]) => {
    projList.forEach(({ name: project, city }) => {
      const count = rInt(18, 28);

      for (let i = 0; i < count; i++) {
        const unitType   = rand(UNIT_TYPES);
        const status     = rand(STATUS_OPTS);
        const hasOwner   = ["Contracted","Reserved","Hold","Partner"].includes(status);
        const isVilla    = ["Villa","Town House","Twin House"].includes(unitType);
        const isPH       = unitType === "Penthouse";

        const grossArea  = rInt(80, 380);
        const netArea    = fmt(grossArea * 0.87);
        const intArea    = fmt(netArea   * 0.92);
        const basePsm    = rInt(14_000, 58_000);
        const basePrice  = fmt(netArea * basePsm);
        const salesVal   = fmt(basePrice * (1 + rInt(5,25)/100));
        const cashPrice  = fmt(basePrice * 0.87);
        const maint      = rand([0.5, 0.75, 1.0]);
        const dpPct      = rand([5, 10, 15, 20]);
        const yrs        = rand([3, 5, 7, 10]);
        const covTer     = rInt(0, 40);
        const uncovTer   = rInt(0, 60);
        const landArea   = isVilla ? rInt(150, 600) : 0;
        const gardenArea = isVilla ? rInt(50, 200) : 0;
        const phArea     = isPH    ? rInt(50, 150)  : 0;

        const prefix = company.split(" ")[0].slice(0,2).toUpperCase();
        const proj3  = project.split(" ")[0].slice(0,3).toUpperCase();
        const code   = `${prefix}-${proj3}-${String(uid).padStart(4,"0")}`;

        units.push({
          id:                       uid,
          company,
          unit_code:                code,
          project,
          city,
          building_number:          `B${rInt(1,20)}`,
          unit_type:                unitType,

          // status & pricing
          status,
          payment_plan_code:        `PP-${rInt(100,999)}`,
          sales_phasing:            `Phase ${rInt(1,4)}`,
          interest_free_unit_price: salesVal,
          sales_value:              salesVal,
          total_premium_percent:    rInt(5,25),

          // dates
          reservation_date:         hasOwner ? rDate(2022,2024) : null,
          owner:                    hasOwner ? rand(OWNERS)     : null,
          contract_date:            status === "Contracted" ? rDate(2022,2024) : null,
          creation_date:            rDate(2021,2022),
          delivery_date:            rDate(2025,2028),
          development_delivery_date:rDate(2025,2027),
          construction_delivery_date:rDate(2024,2026),
          client_handover_date:     status === "Contracted" ? rDate(2025,2028) : null,
          contract_delivery_date:   status === "Contracted" ? rDate(2025,2027) : null,

          // phasing & types
          construction_phasing:     `CP${rInt(1,5)}`,
          handover_phasing:         `HP${rInt(1,3)}`,
          phasing:                  `P${rInt(1,4)}`,
          unit_model:               `Model ${String.fromCharCode(65+rInt(0,5))}`,
          plot_type:                rand(["Standard","Corner","Premium"]),
          building_style:           rand(["Contemporary","Mediterranean","Modern"]),
          building_type:            rand(["Residential","Mixed Use"]),
          unit_position:            rand(["East","West","North","South","Corner"]),
          floor:                    rand(FLOORS),
          sap_code:                 `SAP${String(uid).padStart(6,"0")}`,
          erp_code:                 `ERP${rInt(10000,99999)}`,
          ams:                      `AMS-${rInt(100,999)}`,

          // specs
          num_bedrooms:             rand([1,2,3,4,5]),
          num_bathrooms:            rand([1,2,3,4]),
          num_parking_slots:        rand([0,1,2]),
          mirror:                   rand(["Yes","No"]),
          finishing_specs:          rand(FINISHING),

          // views & premiums
          main_view:                rand(VIEWS),
          main_view_percent:        rInt(10,30),
          secondary_view:           rand(VIEWS),
          secondary_view_percent:   rInt(5,20),
          back_view:                rand(VIEWS),
          back_view_percent:        rInt(3,15),
          north_breeze:             rand(["Yes","No"]),
          north_breeze_percent:     rInt(0,15),
          levels:                   rand(["Single","Duplex","Triplex"]),
          levels_percent:           rInt(0,10),
          corners:                  rand(["0","1","2"]),
          corners_percent:          rInt(0,20),
          accessibility:            rand(["High","Medium","Low"]),
          accessibility_percent:    rInt(0,15),

          // areas
          gross_area:               grossArea,
          net_area:                 netArea,
          internal_area:            intArea,
          footprint:                fmt(grossArea * 0.6),
          covered_terraces:         covTer,
          uncovered_terraces:       uncovTer,
          penthouse_area:           phArea,
          garage_area:              rInt(0,30),
          basement_area:            rInt(0,50),
          common_area:              rInt(10,40),
          roof_pergola_area:        rInt(0,30),
          roof_terraces_area:       rInt(0,50),
          bua:                      fmt(grossArea * 1.1),
          land_area:                landArea,
          garden_area:              gardenArea,
          total_area:               grossArea + covTer + uncovTer + phArea,
          area_range:               grossArea < 100 ? "50-100"
                                  : grossArea < 150 ? "100-150"
                                  : grossArea < 200 ? "150-200"
                                  : grossArea < 250 ? "200-250"
                                  : "250+",

          // pricing
          base_price:               basePrice,
          cash_price:               cashPrice,
          contract_value:           status==="Contracted" ? salesVal : null,
          collected_amount:         status==="Contracted" ? fmt(salesVal * rInt(10,60)/100) : null,
          collected_percent:        status==="Contracted" ? rInt(10,60)  : null,
          discount:                 fmt(basePrice * rInt(0,10)/100),
          total_premium_value:      fmt(basePrice * rInt(5,25)/100),
          special_premiums:         rand(["Corner","Pool View","High Floor","Sea View",null,null]),
          special_discounts:        rand(["Cash Discount","Bulk Discount","Seasonal Offer",null,null]),
          maintenance_percent:      maint,
          maintenance_value:        fmt(salesVal * maint/100),
          gas:                      rInt(5_000, 25_000),
          parking_price:            rInt(100_000, 500_000),
          club:                     rand(["Included","Optional","Not Available"]),

          // psm
          psm:                      basePsm,
          net_area_psm:             fmt(basePsm * 1.12),
          covered_terraces_psm:     fmt(basePsm * 0.5),
          uncovered_terraces_psm:   fmt(basePsm * 0.3),
          penthouse_psm:            fmt(basePsm * 0.8),
          garage_psm:               rInt(8_000, 20_000),
          basement_psm:             rInt(5_000, 15_000),
          common_area_psm:          rInt(3_000, 10_000),
          roof_pergola_psm:         rInt(5_000, 12_000),
          roof_terraces_psm:        rInt(4_000, 10_000),
          land_psm:                 rInt(10_000, 30_000),
          garden_psm:               rInt(5_000, 15_000),
          base_psm:                 basePsm,
          interest_free_psm:        fmt(basePsm * 1.2),

          // payment plan
          interest_free_years:      yrs,
          down_payment_percent:     dpPct,
          down_payment:             fmt(salesVal * dpPct/100),
          contract_percent:         rand([5,10]),
          contract_payment:         fmt(salesVal * 0.05),
          delivery_percent:         rand([10,15,20]),
          delivery_payment:         fmt(salesVal * 0.15),
          contract_payment_plan:    `${yrs} Years`,
          grace_period_months:      rand([0,3,6,12]),

          // blocking & admin
          blocking_reason:          ["Blocked Development","Blocked Sales","Blocked Cancelation"].includes(status)
                                      ? rand(["Under Renovation","Legal Hold","Reserved for Partner","Price Review"])
                                      : null,
          release_date:             null,
          blocking_date:            ["Blocked Development","Blocked Sales"].includes(status) ? rDate(2023,2024) : null,
          release_year:             rInt(2025,2028),
          sales_year:               rInt(2022,2024),
          adj_status:               rand(["Active","Inactive",null]),

          // contractor / broker
          contractor_type:          rand(["Direct","Indirect","Partner"]),
          contractor:               rand(CONTRACTORS),
          customer:                 hasOwner ? rand(OWNERS)  : null,
          broker:                   rand(BROKERS),
          bulks:                    rand(["Bulk A","Bulk B",null,null]),
          direct_indirect_sales:    rand(["Direct","Indirect"]),
        });

        uid++;
      }
    });
  });

  return units;
};

export const mockUnits = generateUnits();
// ─────────────────────────────────────────────────────────────────────────────