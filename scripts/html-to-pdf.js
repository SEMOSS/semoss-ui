#!/usr/bin/env node

/**
 * Convert HTML to PDF
 * Usage: node html-to-pdf.js <input.html> <output.pdf>
 */

const fs = require('fs');
const path = require('path');

// Try to use html2pdf library
let html2pdf;
try {
  html2pdf = require('html2pdf.js');
} catch (e) {
  console.log('Note: html2pdf.js not installed. PDF generation skipped.');
  console.log('To enable PDF generation, run: npm install html2pdf.js');
  process.exit(0);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node html-to-pdf.js <input.html> <output.pdf>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

try {
  const htmlContent = fs.readFileSync(inputFile, 'utf-8');
  
  // Configure PDF options
  const opts = {
    margin: 10,
    filename: outputFile,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };
  
  // Generate PDF
  html2pdf().set(opts).from.string(htmlContent).save()
    .then(() => {
      console.log(`✓ PDF saved to: ${outputFile}`);
    })
    .catch(error => {
      console.error('Error generating PDF:', error.message);
      process.exit(1);
    });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
