import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDFReport = async (companyName, filteredCount, totalCount) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(255, 107, 53); // Orange
  pdf.text('Inventory Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setTextColor(74, 85, 104); // Gray
  pdf.text(`Company: ${companyName}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  pdf.text(`Showing ${filteredCount} of ${totalCount} units`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;

  // Capture KPI Section
  const kpiSection = document.querySelector('.kpi-section');
  if (kpiSection) {
    const canvas = await html2canvas(kpiSection, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (yPosition + imgHeight > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    yPosition += imgHeight + 10;
  }

  // Capture all chart cards
  const chartCards = document.querySelectorAll('.chart-card');
  
  for (let i = 0; i < chartCards.length; i++) {
    const card = chartCards[i];
    
    try {
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: card.scrollWidth,
        windowHeight: card.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if we need a new page
      if (yPosition + imgHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
  }

  // Capture Unit Metrics charts
  const unitMetricsSection = document.querySelector('.unit-metrics-charts-container');
  if (unitMetricsSection) {
    const metricsCharts = unitMetricsSection.querySelectorAll('.chart-card');
    
    for (let i = 0; i < metricsCharts.length; i++) {
      const card = metricsCharts[i];
      
      try {
        const canvas = await html2canvas(card, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Error capturing metrics chart:', error);
      }
    }
  }

  // Save PDF
  const fileName = `Inventory_Report_${companyName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};