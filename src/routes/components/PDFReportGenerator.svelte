<script lang="ts">
  import { jsPDF } from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import type { BuildingInsightsResponse } from '../solar';
  import { showMoney } from '../utils';
  
  export let buildingInsights: BuildingInsightsResponse | undefined;
  export let capturedImages: { [key: string]: string } = {};
  export let propertyAddress = 'Selected Property';
  export let isGenerating = false;
  
  // Report data (will be calculated from buildingInsights)
  $: reportData = buildingInsights ? calculateReportData(buildingInsights) : null;
  
  function calculateReportData(insights: BuildingInsightsResponse) {
    // Extract key data for the report
    const annualProduction = insights.solarPotential?.maxArrayPanelsCount 
      ? insights.solarPotential.maxArrayPanelsCount * 350 // Assume 350W panels
      : 4000; // Default
      
    const roofArea = insights.solarPotential?.maxArrayAreaMeters2 || 25;
    const panelsCount = insights.solarPotential?.maxArrayPanelsCount || 12;
    const installationCost = panelsCount * 130; // €130 per panel
    
    // FiT calculations
    const fitLowIncome = annualProduction * 0.105;
    const fitHighIncome = annualProduction * 0.15;
    const installationCostLow = installationCost * 0.5; // 50% grant
    
    return {
      annualProduction,
      roofArea,
      panelsCount,
      installationCost,
      installationCostLow,
      fitLowIncome,
      fitHighIncome,
      paybackLow: installationCostLow / fitLowIncome,
      paybackHigh: installationCost / fitHighIncome,
      totalBenefit25Low: (fitLowIncome * 20) - installationCostLow, // Simplified 25-year calc
      totalBenefit25High: (fitHighIncome * 20) - installationCost
    };
  }
  
  export async function generatePDF(): Promise<void> {
    console.log('PDFReportGenerator: Starting PDF generation...');
    console.log('PDFReportGenerator: buildingInsights:', !!buildingInsights);
    console.log('PDFReportGenerator: reportData:', !!reportData);
    console.log('PDFReportGenerator: capturedImages:', Object.keys(capturedImages));
    
    if (!reportData || !buildingInsights) {
      console.warn('PDFReportGenerator: Missing required data');
      console.warn('PDFReportGenerator: reportData:', reportData);
      console.warn('PDFReportGenerator: buildingInsights:', buildingInsights);
      return;
    }
    
    isGenerating = true;
    
    try {
      console.log('PDFReportGenerator: Creating jsPDF instance...');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      console.log('PDFReportGenerator: Generating cover page...');
      // Page 1: Cover Page
      generateCoverPage(doc, pageWidth, pageHeight);
      
      console.log('PDFReportGenerator: Generating executive summary...');
      // Page 2: Executive Summary
      doc.addPage();
      generateExecutiveSummary(doc, pageWidth, pageHeight);
      
      console.log('PDFReportGenerator: Generating solar analysis...');
      // Page 3: Solar Analysis
      doc.addPage();
      generateSolarAnalysis(doc, pageWidth, pageHeight);
      
      console.log('PDFReportGenerator: Generating financial analysis...');
      // Page 4: Financial Analysis
      doc.addPage();
      generateFinancialAnalysis(doc, pageWidth, pageHeight);
      
      console.log('PDFReportGenerator: Generating next steps...');
      // Page 5: Next Steps
      doc.addPage();
      generateNextSteps(doc, pageWidth, pageHeight);
      
      // Save the PDF
      const fileName = `SolarScan_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('PDFReportGenerator: Saving PDF as:', fileName);
      doc.save(fileName);
      
      console.log('PDFReportGenerator: PDF generated successfully');
    } catch (error) {
      console.error('PDFReportGenerator: Error generating PDF:', error);
      console.error('PDFReportGenerator: Error stack:', error.stack);
      throw error; // Re-throw to propagate to button handler
    } finally {
      isGenerating = false;
    }
  }
  
  function generateCoverPage(doc: jsPDF, pageWidth: number, pageHeight: number) {
    // Company branding
    doc.setFillColor(0, 100, 150);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('🌞 SolarScan Malta', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Solar Analysis Report', pageWidth / 2, 35, { align: 'center' });
    
    // Property address
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Property Analysis', pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(propertyAddress, pageWidth / 2, 95, { align: 'center' });
    
    // Property image (if available)
    if (capturedImages.rgb) {
      try {
        doc.addImage(capturedImages.rgb, 'PNG', 20, 110, pageWidth - 40, 120);
      } catch (error) {
        console.warn('Could not add property image:', error);
      }
    }
    
    // Date
    doc.setFontSize(12);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 250, { align: 'center' });
    
    // Footer
    doc.setFillColor(0, 100, 150);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Professional Solar Installation Services • Licensed & Insured • Government Grant Approved', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  function generateExecutiveSummary(doc: jsPDF, pageWidth: number, pageHeight: number) {
    if (!reportData) return;
    
    // Header
    doc.setTextColor(0, 100, 150);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, 30);
    
    // Key metrics boxes
    const metrics = [
      { label: 'Annual Production', value: `${Math.round(reportData.annualProduction).toLocaleString()} kWh`, color: [34, 197, 94] },
      { label: 'Recommended Panels', value: `${reportData.panelsCount} panels`, color: [59, 130, 246] },
      { label: 'Roof Area Suitable', value: `${Math.round(reportData.roofArea)} m²`, color: [168, 85, 247] },
      { label: 'Payback Period (Low FiT)', value: `${reportData.paybackLow.toFixed(1)} years`, color: [249, 115, 22] }
    ];
    
    let yPos = 50;
    metrics.forEach((metric, index) => {
      const xPos = 20 + (index % 2) * 90;
      if (index % 2 === 0 && index > 0) yPos += 40;
      
      // Box
      doc.setFillColor(...metric.color);
      doc.roundedRect(xPos, yPos, 80, 30, 3, 3, 'F');
      
      // Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(metric.value, xPos + 40, yPos + 15, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(metric.label, xPos + 40, yPos + 25, { align: 'center' });
    });
    
    // Recommendations
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Our Recommendation', 20, 160);
    
    const recommendations = [
      `Install ${reportData.panelsCount} solar panels for optimal ROI`,
      `Choose Low FiT option with 50% government grant`,
      `Expected payback in ${reportData.paybackLow.toFixed(1)} years`,
      `Total 25-year profit: ${showMoney(reportData.totalBenefit25Low)}`
    ];
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let recYPos = 175;
    recommendations.forEach(rec => {
      doc.text(`• ${rec}`, 25, recYPos);
      recYPos += 8;
    });
    
    // Annual solar image
    if (capturedImages.annualFlux) {
      try {
        doc.addImage(capturedImages.annualFlux, 'PNG', 20, 210, pageWidth - 40, 60);
        doc.setFontSize(10);
        doc.text('Annual Solar Irradiation Analysis', pageWidth / 2, 275, { align: 'center' });
      } catch (error) {
        console.warn('Could not add annual flux image:', error);
      }
    }
  }
  
  function generateSolarAnalysis(doc: jsPDF, pageWidth: number, pageHeight: number) {
    // Header
    doc.setTextColor(0, 100, 150);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Solar Analysis', 20, 30);
    
    // Technical specifications
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('System Specifications', 20, 50);
    
    if (reportData) {
      const specs = [
        ['Annual Energy Production', `${Math.round(reportData.annualProduction).toLocaleString()} kWh`],
        ['Recommended System Size', `${(reportData.panelsCount * 0.35).toFixed(1)} kW`],
        ['Number of Panels', `${reportData.panelsCount} panels`],
        ['Roof Area Required', `${Math.round(reportData.roofArea)} m²`],
        ['Daily Average Production', `${Math.round(reportData.annualProduction / 365)} kWh`]
      ];
      
      // Create table
      autoTable(doc, {
        startY: 60,
        head: [['Specification', 'Value']],
        body: specs,
        theme: 'striped',
        headStyles: { fillColor: [0, 100, 150] },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Add captured images if available
    let imageY = 130;
    
    if (capturedImages.mask) {
      try {
        doc.addImage(capturedImages.mask, 'PNG', 20, imageY, 80, 60);
        doc.setFontSize(10);
        doc.text('Suitable Roof Areas', 60, imageY + 65, { align: 'center' });
      } catch (error) {
        console.warn('Could not add mask image:', error);
      }
    }
    
    // Add monthly/hourly images if available
    const timeFrames = ['monthlyFlux', 'hourlyShade'];
    timeFrames.forEach((frame, index) => {
      const xPos = 110;
      const yPos = imageY + (index * 70);
      
      if (capturedImages[frame]) {
        try {
          doc.addImage(capturedImages[frame], 'PNG', xPos, yPos, 80, 60);
          doc.setFontSize(10);
          doc.text(frame === 'monthlyFlux' ? 'Monthly Variations' : 'Daily Shadow Patterns', xPos + 40, yPos + 65, { align: 'center' });
        } catch (error) {
          console.warn(`Could not add ${frame} image:`, error);
        }
      }
    });
  }
  
  function generateFinancialAnalysis(doc: jsPDF, pageWidth: number, pageHeight: number) {
    if (!reportData) return;
    
    // Header
    doc.setTextColor(0, 100, 150);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Analysis', 20, 30);
    
    // FiT comparison table
    const fitData = [
      ['', 'Low FiT (€0.105/kWh)', 'High FiT (€0.15/kWh)'],
      ['Installation Cost', showMoney(reportData.installationCostLow) + ' (50% grant)', showMoney(reportData.installationCost)],
      ['Annual FiT Income', showMoney(reportData.fitLowIncome), showMoney(reportData.fitHighIncome)],
      ['Payback Period', `${reportData.paybackLow.toFixed(1)} years`, `${reportData.paybackHigh.toFixed(1)} years`],
      ['25-Year Total Profit', showMoney(reportData.totalBenefit25Low), showMoney(reportData.totalBenefit25High)]
    ];
    
    autoTable(doc, {
      startY: 50,
      head: [fitData[0]],
      body: fitData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [0, 100, 150] },
      columnStyles: {
        1: { fillColor: [219, 234, 254] }, // Light blue for Low FiT
        2: { fillColor: [220, 252, 231] }  // Light green for High FiT
      },
      margin: { left: 20, right: 20 }
    });
    
    // Recommendation box  
    // Get last table final Y position - autoTable updates the doc with lastAutoTable property
    const recY = ((doc as any).lastAutoTable?.finalY || 160) + 20;
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(20, recY, pageWidth - 40, 40, 5, 5, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('💡 Our Recommendation: Low FiT Option', pageWidth / 2, recY + 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Save ${showMoney(reportData.installationCost - reportData.installationCostLow)} upfront with government grant!`, pageWidth / 2, recY + 28, { align: 'center' });
    
    // Government grant info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Government Grant Information', 20, recY + 60);
    
    const grantInfo = [
      '• 50% installation cost covered by Malta government grant',
      '• Available for residential properties with Low FiT option',
      '• Grant amount: up to €2,500 maximum per installation',
      '• Fast-track application process with approved installers',
      '• Limited time offer - subject to budget availability'
    ];
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let grantY = recY + 75;
    grantInfo.forEach(info => {
      doc.text(info, 25, grantY);
      grantY += 7;
    });
  }
  
  function generateNextSteps(doc: jsPDF, pageWidth: number, pageHeight: number) {
    // Header
    doc.setTextColor(0, 100, 150);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Steps', 20, 30);
    
    // Process timeline
    const steps = [
      { step: '1', title: 'Free Consultation', desc: 'Site visit and detailed assessment' },
      { step: '2', title: 'Custom Design', desc: 'Tailored system design for your roof' },
      { step: '3', title: 'Grant Application', desc: 'We handle all paperwork for you' },
      { step: '4', title: 'Installation', desc: '1-day professional installation' },
      { step: '5', title: 'Activation', desc: 'Grid connection and system activation' }
    ];
    
    let stepY = 60;
    steps.forEach(step => {
      // Step circle
      doc.setFillColor(0, 100, 150);
      doc.circle(35, stepY, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(step.step, 35, stepY + 3, { align: 'center' });
      
      // Step content
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(step.title, 50, stepY - 2);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(step.desc, 50, stepY + 8);
      
      stepY += 25;
    });
    
    // Contact information
    doc.setFillColor(0, 100, 150);
    doc.rect(0, 200, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Ready to Go Solar?', pageWidth / 2, 220, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('📞 Call: +356 2123 4567', pageWidth / 2, 235, { align: 'center' });
    doc.text('💬 WhatsApp: +356 7912 3456', pageWidth / 2, 245, { align: 'center' });
    
    // QR code placeholder
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth / 2 - 15, 270, 30, 30, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text('QR Code\nfor Contact', pageWidth / 2, 285, { align: 'center' });
  }
</script>

<!-- Generation status indicator -->
{#if isGenerating}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="text-center">
        <div class="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Generating Professional Report</h3>
        <p class="text-gray-600 text-sm">Creating your comprehensive solar analysis PDF...</p>
      </div>
    </div>
  </div>
{/if}