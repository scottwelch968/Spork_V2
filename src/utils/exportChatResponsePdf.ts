import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Converts markdown content to styled HTML for PDF rendering
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Code blocks (```...```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre style="background-color: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; margin: 16px 0;"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 12px 0; color: #1f2937;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 22px; font-weight: 600; margin: 24px 0 14px 0; color: #1f2937;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 28px; font-weight: 700; margin: 28px 0 16px 0; color: #111827;">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>');
  
  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left: 4px solid #d1d5db; padding-left: 16px; margin: 16px 0; color: #4b5563; font-style: italic;">$1</blockquote>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />');
  
  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.7;">');
  
  // Single newlines to <br>
  html = html.replace(/\n/g, '<br />');
  
  return `<p style="margin: 12px 0; line-height: 1.7;">${html}</p>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Exports chat response content as a rich-formatted PDF
 * @param markdownContent - The markdown content to export
 * @param fileName - The name for the PDF file (without extension)
 * @returns A Blob containing the PDF data
 */
export async function exportChatResponseToPdf(
  markdownContent: string,
  fileName: string
): Promise<Blob> {
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 700px;
    padding: 40px;
    background: white;
    font-family: 'Lora', Georgia, serif;
    font-size: 14px;
    color: #1f2937;
    line-height: 1.6;
  `;
  
  // Add header
  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;';
  header.innerHTML = `
    <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">${escapeHtml(fileName)}</h1>
    <p style="font-size: 12px; color: #6b7280; margin: 0;">Generated on ${new Date().toLocaleString()}</p>
  `;
  container.appendChild(header);
  
  // Add content
  const content = document.createElement('div');
  content.innerHTML = markdownToHtml(markdownContent);
  container.appendChild(content);
  
  document.body.appendChild(container);
  
  try {
    // Capture the container as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;
    let pageNum = 1;
    
    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pageNum++;
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }
    
    // Add page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(`Page ${i} of ${totalPages}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 10, {
        align: 'center'
      });
    }
    
    // Return as Blob
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

/**
 * Converts a Blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
