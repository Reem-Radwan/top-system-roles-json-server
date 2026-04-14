export const companies = [
  { id: 1, name: 'Mint' },
  { id: 2, name: 'Palmier Developments' },
  { id: 3, name: 'IGI Developments' }

];

export const projects = {
  1: [
    { id: 1, name: 'North Coast Project', company_id: 1 },
    { id: 2, name: 'New Cairo Compound', company_id: 1 },
    { id: 3, name: 'West Cairo Heights', company_id: 1 }
  ],
  2: [
    { id: 4, name: 'October Plaza', company_id: 2 },
    { id: 5, name: 'Smart Village Residences', company_id: 2 }
  ],
  3: [
    { id: 6, name: 'Palm Valley', company_id: 3 },
    { id: 7, name: 'Palm Parks', company_id: 3 }
  ]
};

// Generate mock units for realistic data
const generateUnits = (projectId, projectName, companyId, count = 231) => {
  const units = [];
  const statuses = ['Available', 'Contracted', 'Reserved', 'Unreleased'];
  const unitModels = ['TW1', 'S1', 'S2', 'S3', 'Studio 01', 'Studio 02', 'Terrace Villa', 'MU', 'TW2', 'TW3'];
  const mainViews = ['Garden View', 'Pool View', 'Street View', 'Landscape View'];
  const secondaryViews = ['Partial Sea', 'Full Sea', 'Mountain', 'City'];
  const northBreeze = ['Yes', 'No'];
  const corners = ['Corner', 'Not Corner'];
  const accessibility = ['Ground Floor', 'High Floor', 'Mid Floor'];
  
  for (let i = 0; i < count; i++) {
    const basePrice = 800000 + Math.random() * 4200000;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    units.push({
      id: `${projectId}_${i}`,
      company_id: companyId,
      project: projectName,
      unit_model: unitModels[Math.floor(Math.random() * unitModels.length)],
      status: status,
      interest_free_unit_price: basePrice,
      main_view: mainViews[Math.floor(Math.random() * mainViews.length)],
      secondary_view: secondaryViews[Math.floor(Math.random() * secondaryViews.length)],
      north_breeze: northBreeze[Math.floor(Math.random() * northBreeze.length)],
      corners: corners[Math.floor(Math.random() * corners.length)],
      accessibility: accessibility[Math.floor(Math.random() * accessibility.length)],
      special_premiums: Math.random() > 0.7 ? 'Premium Location' : '',
      special_discounts: Math.random() > 0.8 ? 'Early Bird' : ''
    });
  }
  
  return units;
};

export const units = {
  1: generateUnits(1, 'North Coast Project', 1, 231),
  2: generateUnits(2, 'New Cairo Compound', 1, 180),
  3: generateUnits(3, 'West Cairo Heights', 1, 156),
  4: generateUnits(4, 'October Plaza', 2, 200),
  5: generateUnits(5, 'Smart Village Residences', 2, 175),
  6: generateUnits(6, 'Palm Valley', 3, 220),
  7: generateUnits(7, 'Palm Parks', 3, 190)
};

// Premium percentages mapping
export const premiumPercentages = {
  1: {
    'Garden View': 5.0,
    'Pool View': 8.0,
    'Street View': 0.0,
    'Landscape View': 6.0,
    'Partial Sea': 10.0,
    'Full Sea': 15.0,
    'Mountain': 7.0,
    'City': 3.0,
    'Yes': 4.0,
    'No': 0.0,
    'Corner': 5.0,
    'Not Corner': 0.0,
    'Ground Floor': 8.0,
    'High Floor': 12.0,
    'Mid Floor': 5.0,
    'Premium Location': 10.0,
    'Early Bird': -5.0
  },
  2: {
    'Garden View': 6.0,
    'Pool View': 9.0,
    'Street View': 0.0,
    'Landscape View': 5.0,
    'Partial Sea': 11.0,
    'Full Sea': 16.0,
    'Mountain': 8.0,
    'City': 4.0,
    'Yes': 5.0,
    'No': 0.0,
    'Corner': 6.0,
    'Not Corner': 0.0,
    'Ground Floor': 7.0,
    'High Floor': 13.0,
    'Mid Floor': 6.0,
    'Premium Location': 12.0,
    'Early Bird': -6.0
  },
  3: {
    'Garden View': 5.5,
    'Pool View': 8.5,
    'Street View': 0.0,
    'Landscape View': 5.5,
    'Partial Sea': 10.5,
    'Full Sea': 15.5,
    'Mountain': 7.5,
    'City': 3.5,
    'Yes': 4.5,
    'No': 0.0,
    'Corner': 5.5,
    'Not Corner': 0.0,
    'Ground Floor': 7.5,
    'High Floor': 12.5,
    'Mid Floor': 5.5,
    'Premium Location': 11.0,
    'Early Bird': -5.5
  },
  4: {
    'Garden View': 5.0,
    'Pool View': 8.0,
    'Street View': 0.0,
    'Landscape View': 6.0,
    'Partial Sea': 10.0,
    'Full Sea': 15.0,
    'Mountain': 7.0,
    'City': 3.0,
    'Yes': 4.0,
    'No': 0.0,
    'Corner': 5.0,
    'Not Corner': 0.0,
    'Ground Floor': 8.0,
    'High Floor': 12.0,
    'Mid Floor': 5.0,
    'Premium Location': 10.0,
    'Early Bird': -5.0
  },
  5: {
    'Garden View': 6.0,
    'Pool View': 9.0,
    'Street View': 0.0,
    'Landscape View': 5.0,
    'Partial Sea': 11.0,
    'Full Sea': 16.0,
    'Mountain': 8.0,
    'City': 4.0,
    'Yes': 5.0,
    'No': 0.0,
    'Corner': 6.0,
    'Not Corner': 0.0,
    'Ground Floor': 7.0,
    'High Floor': 13.0,
    'Mid Floor': 6.0,
    'Premium Location': 12.0,
    'Early Bird': -6.0
  },
  6: {
    'Garden View': 5.5,
    'Pool View': 8.5,
    'Street View': 0.0,
    'Landscape View': 5.5,
    'Partial Sea': 10.5,
    'Full Sea': 15.5,
    'Mountain': 7.5,
    'City': 3.5,
    'Yes': 4.5,
    'No': 0.0,
    'Corner': 5.5,
    'Not Corner': 0.0,
    'Ground Floor': 7.5,
    'High Floor': 12.5,
    'Mid Floor': 5.5,
    'Premium Location': 11.0,
    'Early Bird': -5.5
  },
  7: {
    'Garden View': 5.0,
    'Pool View': 8.0,
    'Street View': 0.0,
    'Landscape View': 6.0,
    'Partial Sea': 10.0,
    'Full Sea': 15.0,
    'Mountain': 7.0,
    'City': 3.0,
    'Yes': 4.0,
    'No': 0.0,
    'Corner': 5.0,
    'Not Corner': 0.0,
    'Ground Floor': 8.0,
    'High Floor': 12.0,
    'Mid Floor': 5.0,
    'Premium Location': 10.0,
    'Early Bird': -5.0
  }
};

// FIX: Assigned to a named variable before exporting to satisfy the
// 'import/no-anonymous-default-export' rule.
const mockDataAnalysis = {
  companies,
  projects,
  units,
  premiumPercentages
};

export default mockDataAnalysis;