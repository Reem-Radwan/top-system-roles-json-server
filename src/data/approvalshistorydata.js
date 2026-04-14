// approvalhistorydata.js
// Mock data for the Historical Sales Requests page

export const MOCK = {
  mint: {
    meta: { company_name: "Mint", show_base_price: true },
    rows: [
      { salesman: "Ahmed Rashed",  client_id: "CL-1001", unit_code: "MNT-A01-12", date: "2025-03-15", date_ts: 1742000000000, land_area: 210,  gross_area: 185, base_price: 4800000,  sales_price: 5250000  },
      { salesman: "John Doe",      client_id: "CL-1002", unit_code: "MNT-B03-07", date: "2025-02-20", date_ts: 1740000000000, land_area: null, gross_area: 142, base_price: 3200000,  sales_price: 3500000  },
      { salesman: "Mike Johnson",  client_id: "CL-1003", unit_code: "MNT-C05-21", date: "2025-01-10", date_ts: 1736500000000, land_area: 300,  gross_area: 270, base_price: 7100000,  sales_price: 7800000  },
      { salesman: "Jane Smith",    client_id: "CL-1004", unit_code: "MNT-A02-08", date: "2024-11-25", date_ts: 1732500000000, land_area: null, gross_area: 120, base_price: 2900000,  sales_price: 3150000  },
      { salesman: "Lisa Brown",    client_id: "CL-1005", unit_code: "MNT-D01-15", date: "2024-10-30", date_ts: 1730300000000, land_area: 450,  gross_area: 390, base_price: 9500000,  sales_price: 10400000 },
      { salesman: "Ahmed Rashed",  client_id: "CL-1006", unit_code: "MNT-A03-11", date: "2024-09-14", date_ts: 1726300000000, land_area: 180,  gross_area: 165, base_price: 4200000,  sales_price: 4600000  },
      { salesman: "John Doe",      client_id: "CL-1007", unit_code: "MNT-B01-03", date: "2024-08-05", date_ts: 1722800000000, land_area: null, gross_area: 98,  base_price: 2400000,  sales_price: 2650000  },
      { salesman: "Mike Johnson",  client_id: "CL-1008", unit_code: "MNT-C02-19", date: "2024-07-22", date_ts: 1721600000000, land_area: 260,  gross_area: 230, base_price: 5800000,  sales_price: 6300000  },
      { salesman: "Jane Smith",    client_id: "CL-1009", unit_code: "MNT-A04-06", date: "2024-06-10", date_ts: 1718000000000, land_area: null, gross_area: 155, base_price: 3700000,  sales_price: 4050000  },
      { salesman: "Lisa Brown",    client_id: "CL-1010", unit_code: "MNT-D02-22", date: "2024-05-18", date_ts: 1715900000000, land_area: 520,  gross_area: 480, base_price: 11800000, sales_price: 12900000 },
      { salesman: "Ahmed Rashed",  client_id: "CL-1011", unit_code: "MNT-B04-14", date: "2024-04-02", date_ts: 1711980000000, land_area: 220,  gross_area: 195, base_price: 4900000,  sales_price: 5350000  },
      { salesman: "John Doe",      client_id: "CL-1012", unit_code: "MNT-C03-09", date: "2025-04-01", date_ts: 1743400000000, land_area: null, gross_area: 110, base_price: 2750000,  sales_price: 3000000  },
    ],
  },
  palmier: {
    meta: { company_name: "Palmier Developments", show_base_price: false },
    rows: [
      { salesman: "Carlos Martinez", client_id: "PL-2001", unit_code: "PAL-G01-04", date: "2025-03-28", date_ts: 1743100000000, land_area: null, gross_area: null, base_price: null, sales_price: 6800000 },
      { salesman: "Emma Wilson",     client_id: "PL-2002", unit_code: "PAL-H02-17", date: "2025-02-14", date_ts: 1739500000000, land_area: null, gross_area: null, base_price: null, sales_price: 4200000 },
      { salesman: "David Lee",       client_id: "PL-2003", unit_code: "PAL-G03-22", date: "2025-01-08", date_ts: 1736300000000, land_area: null, gross_area: null, base_price: null, sales_price: 9100000 },
      { salesman: "Sophia Chen",     client_id: "PL-2004", unit_code: "PAL-H01-09", date: "2024-12-20", date_ts: 1734700000000, land_area: null, gross_area: null, base_price: null, sales_price: 3500000 },
      { salesman: "Oliver King",     client_id: "PL-2005", unit_code: "PAL-G02-33", date: "2024-11-05", date_ts: 1730800000000, land_area: null, gross_area: null, base_price: null, sales_price: 7700000 },
      { salesman: "Carlos Martinez", client_id: "PL-2006", unit_code: "PAL-H03-11", date: "2024-10-12", date_ts: 1728700000000, land_area: null, gross_area: null, base_price: null, sales_price: 5400000 },
      { salesman: "Emma Wilson",     client_id: "PL-2007", unit_code: "PAL-G04-07", date: "2024-09-01", date_ts: 1725200000000, land_area: null, gross_area: null, base_price: null, sales_price: 8200000 },
      { salesman: "David Lee",       client_id: "PL-2008", unit_code: "PAL-H04-28", date: "2024-07-30", date_ts: 1722300000000, land_area: null, gross_area: null, base_price: null, sales_price: 3100000 },
      { salesman: "Sophia Chen",     client_id: "PL-2009", unit_code: "PAL-G05-15", date: "2024-06-18", date_ts: 1718700000000, land_area: null, gross_area: null, base_price: null, sales_price: 6300000 },
      { salesman: "Oliver King",     client_id: "PL-2010", unit_code: "PAL-H05-02", date: "2024-05-05", date_ts: 1714900000000, land_area: null, gross_area: null, base_price: null, sales_price: 4900000 },
    ],
  },
  igi: {
    meta: { company_name: "IGI Developments", show_base_price: true },
    rows: [
      { salesman: "James Rodriguez", client_id: "IG-3001", unit_code: "IGI-T01-08", date: "2025-03-20", date_ts: 1742400000000, land_area: 190,  gross_area: 175, base_price: 4400000,  sales_price: 4850000  },
      { salesman: "Maria Garcia",    client_id: "IG-3002", unit_code: "IGI-S02-14", date: "2025-02-10", date_ts: 1739200000000, land_area: null, gross_area: 130, base_price: 3100000,  sales_price: 3400000  },
      { salesman: "Robert Taylor",   client_id: "IG-3003", unit_code: "IGI-T03-25", date: "2025-01-22", date_ts: 1737500000000, land_area: 380,  gross_area: 340, base_price: 8600000,  sales_price: 9400000  },
      { salesman: "Jennifer White",  client_id: "IG-3004", unit_code: "IGI-S01-06", date: "2024-12-10", date_ts: 1733800000000, land_area: null, gross_area: 105, base_price: 2600000,  sales_price: 2850000  },
      { salesman: "Michael Brown",   client_id: "IG-3005", unit_code: "IGI-T02-18", date: "2024-11-15", date_ts: 1731700000000, land_area: 470,  gross_area: 420, base_price: 10500000, sales_price: 11500000 },
      { salesman: "James Rodriguez", client_id: "IG-3006", unit_code: "IGI-S03-31", date: "2024-10-08", date_ts: 1728400000000, land_area: 200,  gross_area: 180, base_price: 4500000,  sales_price: 4950000  },
      { salesman: "Maria Garcia",    client_id: "IG-3007", unit_code: "IGI-T04-12", date: "2024-09-22", date_ts: 1726960000000, land_area: null, gross_area: 155, base_price: 3800000,  sales_price: 4200000  },
      { salesman: "Robert Taylor",   client_id: "IG-3008", unit_code: "IGI-S04-09", date: "2024-08-14", date_ts: 1723600000000, land_area: 290,  gross_area: 258, base_price: 6500000,  sales_price: 7100000  },
      { salesman: "Jennifer White",  client_id: "IG-3009", unit_code: "IGI-T05-27", date: "2024-07-03", date_ts: 1720000000000, land_area: null, gross_area: 88,  base_price: 2200000,  sales_price: 2420000  },
      { salesman: "Michael Brown",   client_id: "IG-3010", unit_code: "IGI-S05-19", date: "2024-06-25", date_ts: 1719300000000, land_area: 600,  gross_area: 550, base_price: 13500000, sales_price: 14800000 },
      { salesman: "James Rodriguez", client_id: "IG-3011", unit_code: "IGI-T06-04", date: "2024-05-30", date_ts: 1716700000000, land_area: 160,  gross_area: 145, base_price: 3600000,  sales_price: 3950000  },
    ],
  },
};

export const COLS = [
  { key: "salesman",    label: "Salesman",    align: "left",   type: "text"   },
  { key: "client_id",  label: "Client ID",   align: "center", type: "text"   },
  { key: "unit_code",  label: "Unit Code",   align: "center", type: "text"   },
  { key: "date",       label: "Date",        align: "center", type: "date"   },
  { key: "land_area",  label: "Land Area",   align: "center", type: "number", baseOnly: true },
  { key: "gross_area", label: "Gross Area",  align: "center", type: "number", baseOnly: true },
  { key: "base_price", label: "Base Price",  align: "center", type: "number", baseOnly: true },
  { key: "sales_price",label: "Sales Price", align: "center", type: "number" },
];

export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const COMPANIES = [
  { value: "mint",    label: "Mint" },
  { value: "palmier", label: "Palmier Developments" },
  { value: "igi",     label: "IGI Developments" },
];