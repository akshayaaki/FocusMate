import { jsPDF } from "jspdf";

export interface ReportDataPayload {
  studentName: string;
  dateRange: { start: string; end: string };
  generatedAt: string;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  study: {
    totalSessions: number;
    totalMinutes: number;
  };
  habits: {
    totalActive: number;
    completionRatePct: number;
  };
  goals: {
    totalActive: number;
    averageProgressPct: number;
  };
  finance: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    currency: string;
  };
  balanceScore: {
    score: number | null;
    status: string;
  };
}

/**
 * Generates an authentic downloadable CSV string with RFC-4180 escaping.
 */
export function generateCsvExport(
  dataRows: Array<Record<string, string | number | boolean | null>>
): string {
  if (dataRows.length === 0) return "";

  const headers = Object.keys(dataRows[0]);
  const escapeCell = (val: string | number | boolean | null) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvLines: string[] = [];
  csvLines.push(headers.map(escapeCell).join(","));

  for (const row of dataRows) {
    const values = headers.map((header) => escapeCell(row[header] ?? ""));
    csvLines.push(values.join(","));
  }

  return csvLines.join("\r\n");
}

/**
 * Generates an authentic PDF document for the student report.
 */
export function generatePdfReport(data: ReportDataPayload): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const charcoal = [56, 48, 46] as const; // #38302E
  const softSage = [156, 174, 169] as const; // #9CAEA9
  const warmGrey = [111, 104, 102] as const; // #6F6866

  // Header Banner
  doc.setFillColor(...charcoal);
  doc.rect(0, 0, 210, 32, "F");

  // Logo / Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FocusMate", 20, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(204, 218, 209); // #CCDAD1
  doc.text("Your life, in balance. | Student Life & Academic Report", 20, 24);

  // Meta details
  doc.setTextColor(...charcoal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Student: ${data.studentName}`, 20, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...warmGrey);
  doc.text(`Period: ${data.dateRange.start} to ${data.dateRange.end}`, 20, 51);
  doc.text(`Generated on: ${data.generatedAt}`, 20, 57);

  // Divider Line
  doc.setDrawColor(204, 218, 209);
  doc.line(20, 62, 190, 62);

  let y = 72;

  // Section 1: Life Balance Score
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...charcoal);
  doc.text("1. Life Balance Summary", 20, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...warmGrey);
  const scoreDisplay =
    data.balanceScore.score !== null
      ? `${data.balanceScore.score} / 100 (${data.balanceScore.status})`
      : "Insufficient data to compute score";
  doc.text(`Composite Life Balance Score: ${scoreDisplay}`, 25, y);
  y += 12;

  // Section 2: Tasks & Deadlines
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...charcoal);
  doc.text("2. Academic & Personal Tasks", 20, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...warmGrey);
  doc.text(`Total Tasks: ${data.tasks.total}`, 25, y);
  doc.text(`Completed: ${data.tasks.completed}`, 85, y);
  doc.text(`Pending: ${data.tasks.pending}`, 145, y);
  y += 6;
  doc.text(`Overdue: ${data.tasks.overdue}`, 25, y);
  y += 12;

  // Section 3: Study Sessions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...charcoal);
  doc.text("3. Focused Study Time", 20, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...warmGrey);
  doc.text(`Recorded Study Sessions: ${data.study.totalSessions}`, 25, y);
  doc.text(`Total Focus Time: ${data.study.totalMinutes} minutes (${(data.study.totalMinutes / 60).toFixed(1)} hrs)`, 85, y);
  y += 12;

  // Section 4: Habits & Goals
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...charcoal);
  doc.text("4. Habits & Personal Goals", 20, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...warmGrey);
  doc.text(`Active Habits: ${data.habits.totalActive}`, 25, y);
  doc.text(`Habit Completion Rate: ${data.habits.completionRatePct}%`, 85, y);
  y += 6;
  doc.text(`Active Goals: ${data.goals.totalActive}`, 25, y);
  doc.text(`Average Goal Progress: ${data.goals.averageProgressPct}%`, 85, y);
  y += 12;

  // Section 5: Student Finances
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...charcoal);
  doc.text("5. Student Financial Summary", 20, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...warmGrey);
  doc.text(`Total Income: ${data.finance.currency} ${data.finance.totalIncome.toFixed(2)}`, 25, y);
  doc.text(`Total Expenses: ${data.finance.currency} ${data.finance.totalExpenses.toFixed(2)}`, 85, y);
  y += 6;
  doc.text(`Net Cashflow: ${data.finance.currency} ${data.finance.netBalance.toFixed(2)}`, 25, y);
  y += 16;

  // Footer Note
  doc.setDrawColor(204, 218, 209);
  doc.line(20, y, 190, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(...warmGrey);
  doc.text(
    "FocusMate Report — Confidential Student Record. Generated securely via your private FocusMate account.",
    20,
    y
  );

  return doc;
}
