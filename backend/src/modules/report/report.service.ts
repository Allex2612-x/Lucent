import { prisma } from '../../shared/prisma.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { z } from 'zod';

export const exportParamsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export class ReportService {
  /**
   * Generate PDF report with transactions and summary
   */
  static async generatePDF(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Buffer> {
    // Fetch transactions with filters
    const whereClause: any = { userId };
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    // Calculate summary
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }
    }

    const balance = totalIncome - totalExpenses;

    // Generate PDF
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Raport Financiar', { align: 'center' });
      doc.moveDown();

      // Period
      const periodText = startDate && endDate
        ? `Perioada: ${new Date(startDate).toLocaleDateString('ro-RO')} - ${new Date(endDate).toLocaleDateString('ro-RO')}`
        : 'Perioada: Toate tranzacțiile';
      doc.fontSize(12).text(periodText, { align: 'center' });
      doc.moveDown(2);

      // Summary section
      doc.fontSize(16).text('Sumar', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Venituri totale: ${totalIncome.toFixed(2)} RON`);
      doc.text(`Cheltuieli totale: ${totalExpenses.toFixed(2)} RON`);
      doc.text(`Sold: ${balance.toFixed(2)} RON`);
      doc.moveDown(2);

      // Transactions table
      doc.fontSize(16).text('Tranzacții', { underline: true });
      doc.moveDown();

      if (transactions.length === 0) {
        doc.fontSize(12).text('Nu există tranzacții în această perioadă.');
      } else {
        // Table header
        doc.fontSize(10);
        const tableTop = doc.y;
        const colWidths = {
          date: 80,
          description: 150,
          type: 70,
          category: 100,
          amount: 80,
        };

        let x = 50;
        doc.text('Data', x, tableTop, { width: colWidths.date });
        x += colWidths.date;
        doc.text('Descriere', x, tableTop, { width: colWidths.description });
        x += colWidths.description;
        doc.text('Tip', x, tableTop, { width: colWidths.type });
        x += colWidths.type;
        doc.text('Categorie', x, tableTop, { width: colWidths.category });
        x += colWidths.category;
        doc.text('Sumă (RON)', x, tableTop, { width: colWidths.amount });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Table rows
        for (const transaction of transactions) {
          const rowY = doc.y;
          
          // Check if we need a new page
          if (rowY > 700) {
            doc.addPage();
          }

          x = 50;
          doc.text(
            new Date(transaction.date).toLocaleDateString('ro-RO'),
            x,
            doc.y,
            { width: colWidths.date }
          );
          
          const descY = doc.y;
          x += colWidths.date;
          doc.text(
            transaction.description || '-',
            x,
            descY,
            { width: colWidths.description }
          );
          
          x += colWidths.description;
          doc.text(
            transaction.type === 'income' ? 'Venit' : 'Cheltuială',
            x,
            descY,
            { width: colWidths.type }
          );
          
          x += colWidths.type;
          doc.text(
            transaction.category.name,
            x,
            descY,
            { width: colWidths.category }
          );
          
          x += colWidths.category;
          doc.text(
            transaction.amount.toFixed(2),
            x,
            descY,
            { width: colWidths.amount, align: 'right' }
          );

          doc.moveDown(0.5);
        }
      }

      doc.end();
    });
  }

  /**
   * Generate Excel report with transactions and summary
   */
  static async generateExcel(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Buffer> {
    // Fetch transactions with filters
    const whereClause: any = { userId };
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Tranzacții
    const transactionsSheet = workbook.addWorksheet('Tranzacții');
    
    // Define columns
    transactionsSheet.columns = [
      { header: 'Data', key: 'date', width: 15 },
      { header: 'Descriere', key: 'description', width: 30 },
      { header: 'Tip', key: 'type', width: 15 },
      { header: 'Categorie', key: 'category', width: 20 },
      { header: 'Sumă', key: 'amount', width: 15 },
    ];

    // Style header row
    transactionsSheet.getRow(1).font = { bold: true };
    transactionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add transaction rows
    for (const transaction of transactions) {
      transactionsSheet.addRow({
        date: new Date(transaction.date).toLocaleDateString('ro-RO'),
        description: transaction.description || '-',
        type: transaction.type === 'income' ? 'Venit' : 'Cheltuială',
        category: transaction.category.name,
        amount: transaction.amount,
      });
    }

    // Format amount column as currency
    transactionsSheet.getColumn('amount').numFmt = '#,##0.00';

    // Sheet 2: Sumar
    const summarySheet = workbook.addWorksheet('Sumar');
    
    summarySheet.columns = [
      { header: 'Categorie', key: 'category', width: 25 },
      { header: 'Tip', key: 'type', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
    ];

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Calculate totals by category
    const categoryTotals = new Map<
      string,
      { name: string; type: string; total: number }
    >();

    for (const transaction of transactions) {
      const key = `${transaction.categoryId}-${transaction.type}`;
      const existing = categoryTotals.get(key);

      if (existing) {
        existing.total += transaction.amount;
      } else {
        categoryTotals.set(key, {
          name: transaction.category.name,
          type: transaction.type === 'income' ? 'Venit' : 'Cheltuială',
          total: transaction.amount,
        });
      }
    }

    // Add summary rows
    for (const summary of categoryTotals.values()) {
      summarySheet.addRow({
        category: summary.name,
        type: summary.type,
        total: summary.total,
      });
    }

    // Format total column as currency
    summarySheet.getColumn('total').numFmt = '#,##0.00';

    // Add grand totals
    summarySheet.addRow({});
    const totalIncomeRow = summarySheet.addRow({
      category: 'Total Venituri',
      type: '',
      total: transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    });
    totalIncomeRow.font = { bold: true };

    const totalExpensesRow = summarySheet.addRow({
      category: 'Total Cheltuieli',
      type: '',
      total: transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    });
    totalExpensesRow.font = { bold: true };

    const balanceRow = summarySheet.addRow({
      category: 'Sold',
      type: '',
      total:
        transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0) -
        transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
    });
    balanceRow.font = { bold: true };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
