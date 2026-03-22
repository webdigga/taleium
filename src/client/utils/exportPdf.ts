import jsPDF from 'jspdf';

interface Chapter {
  chapter_number: number;
  title: string;
  content: string;
}

interface ExportOptions {
  title: string;
  description?: string | null;
  ageRange: string;
  genre?: string | null;
  chapters: Chapter[];
}

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN_X = 25;
const MARGIN_TOP = 30;
const MARGIN_BOTTOM = 25;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const MAX_Y = PAGE_HEIGHT - MARGIN_BOTTOM;

function addPageNumber(doc: jsPDF, pageNum: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`${pageNum}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 12, { align: 'center' });
}

export function exportBookAsPdf({ title, description, chapters }: ExportOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let pageNum = 1;

  // ===== TITLE PAGE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(27, 21, 18);
  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH);
  const titleStartY = 100;
  doc.text(titleLines, PAGE_WIDTH / 2, titleStartY, { align: 'center' });

  if (description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(138, 126, 114);
    const descLines = doc.splitTextToSize(description, CONTENT_WIDTH - 20);
    doc.text(descLines, PAGE_WIDTH / 2, titleStartY + titleLines.length * 12 + 10, { align: 'center' });
  }

  // Small footer on title page
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text('Created with Taleium', PAGE_WIDTH / 2, PAGE_HEIGHT - 20, { align: 'center' });

  // ===== CHAPTERS =====
  for (const chapter of chapters) {
    doc.addPage();
    pageNum++;
    let y = MARGIN_TOP;

    // Chapter number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(226, 114, 91);
    doc.text(`CHAPTER ${chapter.chapter_number}`, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 8;

    // Chapter title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(27, 21, 18);
    const chTitleLines = doc.splitTextToSize(chapter.title, CONTENT_WIDTH);
    doc.text(chTitleLines, PAGE_WIDTH / 2, y, { align: 'center' });
    y += chTitleLines.length * 8 + 10;

    // Divider line
    doc.setDrawColor(221, 213, 201);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X + 40, y, PAGE_WIDTH - MARGIN_X - 40, y);
    y += 12;

    // Chapter content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(58, 51, 48);

    const paragraphs = chapter.content.split('\n\n');
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para.trim(), CONTENT_WIDTH);
      for (const line of lines) {
        if (y > MAX_Y) {
          addPageNumber(doc, pageNum);
          doc.addPage();
          pageNum++;
          y = MARGIN_TOP;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(58, 51, 48);
        }
        doc.text(line, MARGIN_X, y);
        y += 6;
      }
      y += 4; // paragraph spacing
    }

    addPageNumber(doc, pageNum);
  }

  // Download
  const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.pdf';
  doc.save(filename);
}
