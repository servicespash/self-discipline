/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PDF Export Engine - Cymatic Discipline OS Executive Briefing Generator
 */

import { jsPDF } from 'jspdf';

export interface SummaryPdfParams {
  title?: string;
  summaryText: string;
  userMoniker: string;
  userEmail?: string;
  lockdownActive: boolean;
  dateStr?: string;
}

export function exportSummaryAsPdf({
  title = 'Cymatic OS - Rama Executive Briefing',
  summaryText,
  userMoniker,
  userEmail,
  lockdownActive,
  dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}: SummaryPdfParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 42;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 40;

  // Header Banner Background
  doc.setFillColor(3, 7, 18); // gray-950
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 90, pageWidth, 3, 'F');

  // System Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(240, 253, 244); // emerald-50
  doc.text('CYMATIC DISCIPLINE OS', marginX, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 231, 183); // emerald-300
  doc.text('RAMA ARCHITECTURAL TUTOR & EXECUTIVE ENGINE', marginX, 50);

  // Status Badge
  const statusText = lockdownActive ? 'LOCKDOWN: ENFORCED' : 'STATUS: MONITOR ACTIVE';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const badgeWidth = doc.getTextWidth(statusText) + 16;
  const badgeX = pageWidth - marginX - badgeWidth;
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.roundedRect(badgeX, 26, badgeWidth, 20, 4, 4, 'F');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(statusText, badgeX + 8, 39);

  // Metadata Subheader
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // gray-400
  doc.text(`ARCHITECT: ${userMoniker.toUpperCase()} ${userEmail ? `(${userEmail})` : ''}`, marginX, 74);
  doc.text(`DATE: ${dateStr.toUpperCase()}`, pageWidth - marginX - 160, 74);

  cursorY = 120;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text(title, marginX, cursorY);
  cursorY += 24;

  // Parse and render Markdown Content
  const lines = summaryText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trimEnd();

    // Check for page overflow
    if (cursorY > pageHeight - 60) {
      doc.addPage();
      cursorY = 50;

      // Header repeat on subsequent pages
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('CYMATIC OS // EXECUTIVE BRIEFING (CONTINUED)', marginX, 30);
      doc.setDrawColor(229, 231, 235);
      doc.line(marginX, 35, pageWidth - marginX, 35);
      cursorY = 55;
    }

    if (!rawLine.trim()) {
      cursorY += 8;
      continue;
    }

    // Header 1 / 2
    if (rawLine.startsWith('# ') || rawLine.startsWith('## ')) {
      const cleanHeader = rawLine.replace(/^#+\s*/, '');
      cursorY += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.text(cleanHeader, marginX, cursorY);

      // Underline
      cursorY += 4;
      doc.setDrawColor(209, 250, 229);
      doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
      cursorY += 14;
      continue;
    }

    // Header 3
    if (rawLine.startsWith('### ')) {
      const cleanHeader = rawLine.replace(/^###\s*/, '');
      cursorY += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55); // gray-800
      doc.text(cleanHeader, marginX, cursorY);
      cursorY += 14;
      continue;
    }

    // Checkbox items (- [ ] or - [x])
    if (/^-\s*\[[ xX]\]/.test(rawLine)) {
      const isChecked = /^-\s*\[[xX]\]/.test(rawLine);
      const itemText = rawLine.replace(/^-\s*\[[ xX]\]\s*/, '');

      // Checkbox box
      doc.setDrawColor(16, 185, 129);
      doc.setFillColor(isChecked ? 16 : 255, isChecked ? 185 : 255, isChecked ? 129 : 255);
      doc.roundedRect(marginX + 2, cursorY - 8, 9, 9, 2, 2, isChecked ? 'FD' : 'D');

      doc.setFont('helvetica', isChecked ? 'normal' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81); // gray-700
      const wrapped = doc.splitTextToSize(itemText, contentWidth - 20);
      doc.text(wrapped, marginX + 18, cursorY);
      cursorY += wrapped.length * 13;
      continue;
    }

    // Bullet points (- or *)
    if (/^[-*]\s+/.test(rawLine)) {
      const itemText = rawLine.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1');

      doc.setFillColor(16, 185, 129);
      doc.circle(marginX + 4, cursorY - 3, 2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      const wrapped = doc.splitTextToSize(itemText, contentWidth - 14);
      doc.text(wrapped, marginX + 14, cursorY);
      cursorY += wrapped.length * 13;
      continue;
    }

    // Horizontal Rule
    if (/^---|^===/.test(rawLine)) {
      cursorY += 6;
      doc.setDrawColor(229, 231, 235);
      doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
      cursorY += 12;
      continue;
    }

    // Regular Paragraph
    const cleanText = rawLine.replace(/\*\*(.*?)\*\*/g, '$1');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99); // gray-600
    const wrapped = doc.splitTextToSize(cleanText, contentWidth);
    doc.text(wrapped, marginX, cursorY);
    cursorY += wrapped.length * 13;
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);

    doc.setDrawColor(243, 244, 246);
    doc.line(marginX, pageHeight - 35, pageWidth - marginX, pageHeight - 35);

    doc.text('Cymatic Discipline OS // Rama AI Executive Engine', marginX, pageHeight - 22);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX - 50, pageHeight - 22);
  }

  // Save PDF directly to user machine
  const filename = `Cymatic_Rama_Briefing_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
