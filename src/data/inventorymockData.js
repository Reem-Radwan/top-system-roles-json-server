// Mock data generator with STRICTLY ENFORCED sparse data patterns

const generateCompanySpecificUnits = (companyId, companyName) => {
  const companyConfigs = {
    1: { // Skyline Developments
      projects: ["Skyline Towers", "Azure Heights", "Crystal Plaza", "Diamond Residence", "Emerald Gardens"],
      cities: ["Cairo", "New Cairo", "6th October"],
      unitTypes: ["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "Penthouse", "Duplex"],
      numberOfUnits: 600,
      priceMultiplier: 1.2,
      areaMultiplier: 1.1
    },
    2: { // Urban Properties Ltd
      projects: ["Urban Oasis", "Metropolitan Plaza", "City Hub", "Downtown Suites", "Urban Vista"],
      cities: ["Alexandria", "New Alexandria", "Borg El Arab"],
      unitTypes: ["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "Loft"],
      numberOfUnits: 450,
      priceMultiplier: 1.0,
      areaMultiplier: 1.0
    },
    3: { // Metro Construction
      projects: ["Metro Park", "Central Station", "Transit Hub", "Metro Heights", "Railway Gardens"],
      cities: ["Giza", "Sheikh Zayed", "New Giza"],
      unitTypes: ["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "Penthouse"],
      numberOfUnits: 550,
      priceMultiplier: 0.9,
      areaMultiplier: 0.95
    }
  };

  const config = companyConfigs[companyId] || companyConfigs[1];
  
  const projects = config.projects;
  // FIX: Removed unused 'cities', 'unitTypes', 'statuses', and 'areaRanges' variables.
  // Cities are derived per-project from cityByProject below.
  // Unit types are derived per-project from unitTypesByProject below.
  // Statuses are derived per-project and per-unit-type from their respective lookup objects below.
  // Area ranges are derived per-unit-type from areaByUnitType below.
  const paymentPlans = ["cash", "01 yr", "02 yr", "03 yr", "04 yr", "05 yr", "06 yr", "07 yr"];
  const buildingTypes = ["Tower", "Villa", "Duplex", "Apartment"];
  const unitModels = ["Model A", "Model B", "Model C", "Model D", "Model E"];

  const owners = ["Ahmed Hassan", "Sara Mohamed", "Khaled Ali", "Nour Ibrahim", "Omar Youssef", "Laila Mahmoud", "Tarek Samir", "Dina Fathy"];

  // ✅ STRICT BUSINESS RULES - These define what combinations are POSSIBLE
  
  // 1. Status restrictions by project (not all statuses in all projects)
  const statusByProject = {
    [projects[0]]: ["Available", "Reserved", "Contracted", "Partner"], // Skyline: Has Partner ✅
    [projects[1]]: ["Available", "Unreleased", "Contracted"], // Azure: NO Partner ❌
    [projects[2]]: ["Available", "Reserved", "Contracted", "Hold"], // Crystal: NO Partner ❌
    [projects[3]]: ["Unreleased", "Blocked Development", "Reserved", "Contracted"], // Diamond: NO Partner ❌
    [projects[4]]: ["Available", "Contracted", "Partner"], // Emerald: Has Partner ✅
  };

  // 2. Unit type restrictions by project
  const unitTypesByProject = {
    [projects[0]]: ["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom", "Penthouse"], // Skyline: No Duplex
    [projects[1]]: ["1 Bedroom", "2 Bedroom", "3 Bedroom", "Duplex"], // Azure: No Studio/Penthouse
    [projects[2]]: ["2 Bedroom", "3 Bedroom", "Penthouse"], // Crystal: Only larger units
    [projects[3]]: ["Studio", "1 Bedroom", "2 Bedroom"], // Diamond: Only smaller units
    [projects[4]]: ["2 Bedroom", "3 Bedroom", "Penthouse", "Duplex"], // Emerald: Mid to large
  };

  // 3. Status restrictions by unit type (CRITICAL FOR PARTNER)
  const statusByUnitType = {
    "Studio": ["Available", "Reserved", "Contracted"], // Studios: NO Partner ❌
    "1 Bedroom": ["Available", "Reserved", "Contracted", "Unreleased"], // 1BR: NO Partner ❌
    "2 Bedroom": ["Available", "Reserved", "Contracted", "Partner"], // 2BR: Has Partner ✅
    "3 Bedroom": ["Available", "Reserved", "Contracted", "Partner", "Hold"], // 3BR: Has Partner ✅
    "Penthouse": ["Reserved", "Contracted", "Partner", "Hold"], // Penthouse: Has Partner ✅
    "Duplex": ["Reserved", "Contracted", "Blocked Development"], // Duplex: NO Partner ❌
  };

  // 4. City restrictions (not all projects in all cities)
  const cityByProject = {
    [projects[0]]: ["Cairo", "New Cairo"], // Skyline: 2 cities
    [projects[1]]: ["New Cairo"], // Azure: 1 city only
    [projects[2]]: ["Cairo", "6th October"], // Crystal: 2 cities
    [projects[3]]: ["6th October"], // Diamond: 1 city only
    [projects[4]]: ["Cairo", "New Cairo", "6th October"], // Emerald: all cities
  };

  // 5. Area restrictions by unit type
  const areaByUnitType = {
    "Studio": ["50-75 sqm", "75-100 sqm"],
    "1 Bedroom": ["75-100 sqm", "100-125 sqm"],
    "2 Bedroom": ["100-125 sqm", "125-150 sqm"],
    "3 Bedroom": ["125-150 sqm", "150-200 sqm"],
    "Penthouse": ["150-200 sqm", "200+ sqm"],
    "Duplex": ["150-200 sqm", "200+ sqm"],
  };

  const units = [];
  const numberOfUnits = config.numberOfUnits;

  // ✅ WEIGHTED DISTRIBUTION: More units in common combinations
  const projectWeights = [0.25, 0.20, 0.20, 0.20, 0.15]; // Skyline gets most units
  const cumulativeProjectWeights = projectWeights.reduce((acc, w, i) => {
    acc.push((acc[i - 1] || 0) + w);
    return acc;
  }, []);

  for (let i = 0; i < numberOfUnits; i++) {
    // ✅ Select project with weighted distribution
    const projectRandom = Math.random();
    let projectIndex = 0;
    for (let j = 0; j < cumulativeProjectWeights.length; j++) {
      if (projectRandom < cumulativeProjectWeights[j]) {
        projectIndex = j;
        break;
      }
    }
    const project = projects[projectIndex];
    
    // ✅ City must be valid for this project
    const validCities = cityByProject[project];
    const city = validCities[Math.floor(Math.random() * validCities.length)];
    
    // ✅ Unit type must be valid for this project
    const validUnitTypes = unitTypesByProject[project];
    const unitType = validUnitTypes[Math.floor(Math.random() * validUnitTypes.length)];
    
    // ✅ Area must be valid for this unit type
    const validAreas = areaByUnitType[unitType];
    const areaRange = validAreas[Math.floor(Math.random() * validAreas.length)];
    
    // ✅ CRITICAL: Status must be valid for BOTH project AND unit type (intersection)
    const validStatusesForProject = statusByProject[project];
    const validStatusesForUnitType = statusByUnitType[unitType];
    const validStatuses = validStatusesForProject.filter(s => validStatusesForUnitType.includes(s));
    
    // If no valid statuses (shouldn't happen with proper data), default to Available
    if (validStatuses.length === 0) {
      console.warn(`No valid statuses for ${project} + ${unitType}, skipping unit`);
      continue;
    }
    
    // ✅ Weighted status distribution within valid statuses
    let status;
    if (validStatuses.includes("Contracted") && Math.random() < 0.55) {
      status = "Contracted"; // 55% if available
    } else if (validStatuses.includes("Available") && Math.random() < 0.25) {
      status = "Available"; // 25% if available
    } else if (validStatuses.includes("Partner") && Math.random() < 0.10) {
      status = "Partner"; // 10% if available (RARE!)
    } else if (validStatuses.includes("Reserved") && Math.random() < 0.15) {
      status = "Reserved"; // 15% if available
    } else {
      // Pick randomly from remaining valid statuses
      status = validStatuses[Math.floor(Math.random() * validStatuses.length)];
    }

    const paymentPlan = paymentPlans[Math.floor(Math.random() * paymentPlans.length)];
    const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
    const unitModel = unitModels[Math.floor(Math.random() * unitModels.length)];

    // Generate sellable area based on unit type
    let minArea, maxArea;
    switch (unitType) {
      case "Studio":
        minArea = 50;
        maxArea = 75;
        break;
      case "1 Bedroom":
        minArea = 75;
        maxArea = 100;
        break;
      case "2 Bedroom":
        minArea = 100;
        maxArea = 125;
        break;
      case "3 Bedroom":
        minArea = 125;
        maxArea = 150;
        break;
      case "Penthouse":
      case "Duplex":
        minArea = 150;
        maxArea = 250;
        break;
      default:
        minArea = 50;
        maxArea = 100;
    }

    const baseArea = Math.floor(Math.random() * (maxArea - minArea + 1)) + minArea;
    const sellableArea = Math.floor(baseArea * config.areaMultiplier);
    const psmBase = (15000 + Math.random() * 10000) * config.priceMultiplier;
    const psm = Math.floor(psmBase);
    const interestFreePrice = Math.floor(sellableArea * psmBase);
    const salesValue = Math.floor(interestFreePrice * (1 + Math.random() * 0.2));

    // Generate dates
    const hasReservation = ['Contracted', 'Reserved', 'Hold', 'Partner'].includes(status);
    let reservationDate = null;
    
    if (hasReservation) {
      const currentDate = new Date(2026, 0, 19);
      const yearRandom = Math.random();
      let selectedYear;
      
      if (yearRandom < 0.40) {
        selectedYear = 2025;
      } else if (yearRandom < 0.65) {
        selectedYear = 2024;
      } else if (yearRandom < 0.80) {
        selectedYear = 2023;
      } else if (yearRandom < 0.90) {
        selectedYear = 2022;
      } else if (yearRandom < 0.96) {
        selectedYear = 2021;
      } else {
        selectedYear = 2020;
      }
      
      const activeMonths = {
        2020: [0, 2, 5, 8, 11],
        2021: [1, 3, 4, 6, 9, 10],
        2022: [0, 2, 4, 6, 8, 10],
        2023: [1, 3, 5, 7, 9, 11],
        2024: [0, 1, 3, 4, 6, 7, 9, 10],
        2025: [0, 1, 2, 4, 5, 7, 8, 10, 11],
        2026: [0]
      };
      
      const monthsForYear = activeMonths[selectedYear];
      const selectedMonth = monthsForYear[Math.floor(Math.random() * monthsForYear.length)];
      const selectedDay = Math.floor(Math.random() * 28) + 1;
      
      reservationDate = new Date(selectedYear, selectedMonth, selectedDay);
      
      if (reservationDate > currentDate) {
        reservationDate = currentDate;
      }
    }

    // Contract delivery date
    const deliveryYearRandom = Math.random();
    let deliveryYear;
    
    if (deliveryYearRandom < 0.25) {
      deliveryYear = 2025;
    } else if (deliveryYearRandom < 0.50) {
      deliveryYear = 2026;
    } else if (deliveryYearRandom < 0.75) {
      deliveryYear = 2027;
    } else {
      deliveryYear = 2028;
    }
    
    const deliveryActiveMonths = {
      2025: [0, 2, 5, 8, 11],
      2026: [1, 3, 4, 6, 9, 10],
      2027: [0, 2, 4, 6, 8, 10],
      2028: [1, 3, 5, 7, 9, 11]
    };
    
    const deliveryMonthsForYear = deliveryActiveMonths[deliveryYear];
    const deliveryMonth = deliveryMonthsForYear[Math.floor(Math.random() * deliveryMonthsForYear.length)];
    const deliveryDay = Math.floor(Math.random() * 28) + 1;
    
    const contractDeliveryDate = new Date(deliveryYear, deliveryMonth, deliveryDay);
    const gracePeriodMonths = Math.floor(Math.random() * 7);
    const developmentDeliveryDate = new Date(contractDeliveryDate);
    developmentDeliveryDate.setMonth(developmentDeliveryDate.getMonth() + gracePeriodMonths + Math.floor(Math.random() * 6 - 3));

    // ✅ Owner assignment - weighted by project so each project has primary owners
    const ownersByProject = {
      [projects[0]]: ["Ahmed Hassan", "Sara Mohamed", "Khaled Ali"],
      [projects[1]]: ["Nour Ibrahim", "Omar Youssef", "Ahmed Hassan"],
      [projects[2]]: ["Laila Mahmoud", "Tarek Samir", "Sara Mohamed"],
      [projects[3]]: ["Dina Fathy", "Khaled Ali", "Nour Ibrahim"],
      [projects[4]]: ["Omar Youssef", "Laila Mahmoud", "Tarek Samir"],
    };
    const validOwners = ownersByProject[project] || owners;
    // Only contracted/reserved/partner units have owners
    const owner = hasReservation
      ? validOwners[Math.floor(Math.random() * validOwners.length)]
      : null;

    units.push({
      city,
      project,
      unit_type: unitType,
      area_range: areaRange,
      adj_status_2: status,
      status,
      owner,
      sellable_area: sellableArea,
      psm,
      interest_free_unit_price: interestFreePrice,
      building_type: buildingType,
      grace_period_months: gracePeriodMonths,
      unit_code: `${project.replace(/\s/g, '')}_${String(i + 1).padStart(4, '0')}`,
      sales_value: salesValue,
      reservation_date: reservationDate ? reservationDate.toISOString().split('T')[0] : null,
      development_delivery_date: developmentDeliveryDate.toISOString().split('T')[0],
      contract_delivery_date: contractDeliveryDate.toISOString().split('T')[0],
      unit_model: unitModel,
      adj_contract_payment_plan: paymentPlan,
      project_name: project,
      company_id: companyId,
      company_name: companyName,
      contract_payment_plan: paymentPlan
    });
  }

  // ✅ Log statistics for verification
  console.log(`Generated ${units.length} units for ${companyName}`);
  console.log('Partner units by project:', {
    [projects[0]]: units.filter(u => u.status === 'Partner' && u.project === projects[0]).length,
    [projects[1]]: units.filter(u => u.status === 'Partner' && u.project === projects[1]).length,
    [projects[2]]: units.filter(u => u.status === 'Partner' && u.project === projects[2]).length,
    [projects[3]]: units.filter(u => u.status === 'Partner' && u.project === projects[3]).length,
    [projects[4]]: units.filter(u => u.status === 'Partner' && u.project === projects[4]).length,
  });
  console.log('Partner units by type:', {
    'Studio': units.filter(u => u.status === 'Partner' && u.unit_type === 'Studio').length,
    '1 Bedroom': units.filter(u => u.status === 'Partner' && u.unit_type === '1 Bedroom').length,
    '2 Bedroom': units.filter(u => u.status === 'Partner' && u.unit_type === '2 Bedroom').length,
    '3 Bedroom': units.filter(u => u.status === 'Partner' && u.unit_type === '3 Bedroom').length,
    'Penthouse': units.filter(u => u.status === 'Partner' && u.unit_type === 'Penthouse').length,
    'Duplex': units.filter(u => u.status === 'Partner' && u.unit_type === 'Duplex').length,
  });

  return units;
};

// Generate data for all companies
const companies = [
  { id: 1, name: "Mint" },
  { id: 2, name: "Palmier Developments" },
  { id: 3, name: "IGI Developments" }
];

// Pre-generate data for each company
const companyDataCache = {};
companies.forEach(company => {
  companyDataCache[company.id] = generateCompanySpecificUnits(company.id, company.name);
});

export const getCompanies = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(companies);
    }, 100);
  });
};

export const getCompanyUnits = (companyId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = parseInt(companyId);
      const units = companyDataCache[id] || companyDataCache[1];
      const company = companies.find(c => c.id === id);
      
      console.log(`Loading data for company: ${company?.name} (ID: ${id})`);
      console.log(`Total units: ${units.length}`);
      
      resolve({
        units: units,
        company: company
      });
    }, 300);
  });
};

const mockData = {
  companies: companies,
  getCompanyUnits: getCompanyUnits,
  getCompanies: getCompanies
};

export default mockData;