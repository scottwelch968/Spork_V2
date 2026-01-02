import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPdf(elementId: string, filename: string = 'spork-documentation'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Store original styles
  const originalOverflow = element.style.overflow;
  const originalHeight = element.style.height;
  const originalMaxHeight = element.style.maxHeight;

  try {
    // Expand all collapsible sections
    const collapsibles = element.querySelectorAll('[data-state="closed"]');
    collapsibles.forEach((el) => {
      el.setAttribute('data-state', 'open');
    });

    // Wait for animations to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Make element fully visible for capture
    element.style.overflow = 'visible';
    element.style.height = 'auto';
    element.style.maxHeight = 'none';

    // Capture the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      backgroundColor: '#ffffff',
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add cover page
    pdf.setFontSize(32);
    pdf.setTextColor(59, 130, 246); // Blue color
    pdf.text('Spork', 105, 100, { align: 'center' });
    
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Application Documentation', 105, 120, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    pdf.text(`Generated: ${date}`, 105, 140, { align: 'center' });
    pdf.text('Version 1.0.0', 105, 150, { align: 'center' });
    
    // Add content pages
    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL('image/png');
    
    pdf.addPage();
    
    // Add pages as needed
    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      if (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
      }
    }
    
    // Add page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${i - 1} of ${pageCount - 1}`, 105, 290, { align: 'center' });
    }

    // Download
    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`${filename}-${timestamp}.pdf`);

  } finally {
    // Restore original styles
    element.style.overflow = originalOverflow;
    element.style.height = originalHeight;
    element.style.maxHeight = originalMaxHeight;
  }
}
