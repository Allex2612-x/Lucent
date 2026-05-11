import { prisma } from '../../shared/prisma.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { z } from 'zod';

export const exportParamsSchema = z.object({
  startDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // Handle YYYY-MM-DD format
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return val;
    }
    return val;
  }),
  endDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // Handle YYYY-MM-DD format
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return val;
    }
    return val;
  }),
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
    try {
      console.log('Generating PDF for user:', userId);
      console.log('Date range:', { startDate, endDate });
      
      // Fetch transactions with filters
      const whereClause: any = { userId };
      
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          // Start from the beginning of the month
          const start = new Date(startDate);
          whereClause.date.gte = new Date(start.getFullYear(), start.getMonth(), 1);
        }
        if (endDate) {
          // Include the entire end month (last day at 23:59:59.999)
          const end = new Date(endDate);
          whereClause.date.lte = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);
        }
      }

      console.log('Where clause:', JSON.stringify(whereClause, null, 2));

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: { category: true },
        orderBy: { date: 'desc' },
      });

      console.log('Found transactions:', transactions.length);

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
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          bufferPages: true,
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          console.log('PDF generation completed');
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', (err) => {
          console.error('PDF generation error:', err);
          reject(err);
        });

        // Colors
        const primaryColor = '#4f46e5'; // Indigo
        const successColor = '#10b981'; // Green
        const dangerColor = '#ef4444'; // Red
        const textColor = '#1e293b'; // Dark slate
        const lightGray = '#f1f5f9';
        const borderColor = '#cbd5e1';

        // Header with background
        doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
        
        doc.fillColor('#ffffff')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('Raport Financiar', 50, 40, { align: 'center' });

        // Period
        const periodText = startDate && endDate
          ? `Perioada: ${new Date(startDate).toLocaleDateString('ro-RO')} - ${new Date(endDate).toLocaleDateString('ro-RO')}`
          : 'Perioada: Toate tranzactiile';
        doc.fontSize(12)
           .font('Helvetica')
           .text(periodText, 50, 80, { align: 'center' });

        doc.fillColor(textColor);
        doc.moveDown(4);

        // Summary section with cards
        const summaryY = doc.y;
        const cardWidth = 150;
        const cardHeight = 80;
        const cardSpacing = 20;

        // Income card
        doc.rect(50, summaryY, cardWidth, cardHeight)
           .fillAndStroke(lightGray, borderColor);
        
        doc.fillColor(successColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('VENITURI TOTALE', 60, summaryY + 15, { width: cardWidth - 20 });
        
        doc.fillColor(textColor)
           .fontSize(20)
           .text(`${totalIncome.toFixed(2)}`, 60, summaryY + 35, { width: cardWidth - 20 });
        
        doc.fontSize(10)
           .font('Helvetica')
           .text('RON', 60, summaryY + 60, { width: cardWidth - 20 });

        // Expenses card
        const expenseX = 50 + cardWidth + cardSpacing;
        doc.rect(expenseX, summaryY, cardWidth, cardHeight)
           .fillAndStroke(lightGray, borderColor);
        
        doc.fillColor(dangerColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('CHELTUIELI TOTALE', expenseX + 10, summaryY + 15, { width: cardWidth - 20 });
        
        doc.fillColor(textColor)
           .fontSize(20)
           .text(`${totalExpenses.toFixed(2)}`, expenseX + 10, summaryY + 35, { width: cardWidth - 20 });
        
        doc.fontSize(10)
           .font('Helvetica')
           .text('RON', expenseX + 10, summaryY + 60, { width: cardWidth - 20 });

        // Balance card
        const balanceX = expenseX + cardWidth + cardSpacing;
        const balanceColor = balance >= 0 ? successColor : dangerColor;
        doc.rect(balanceX, summaryY, cardWidth, cardHeight)
           .fillAndStroke(lightGray, borderColor);
        
        doc.fillColor(balanceColor)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('SOLD', balanceX + 10, summaryY + 15, { width: cardWidth - 20 });
        
        doc.fillColor(textColor)
           .fontSize(20)
           .text(`${balance.toFixed(2)}`, balanceX + 10, summaryY + 35, { width: cardWidth - 20 });
        
        doc.fontSize(10)
           .font('Helvetica')
           .text('RON', balanceX + 10, summaryY + 60, { width: cardWidth - 20 });

        doc.y = summaryY + cardHeight + 40;

        // Transactions section
        doc.fillColor(textColor)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('Tranzactii', 50, doc.y);
        
        doc.moveDown(1.5);

        if (transactions.length === 0) {
          doc.fontSize(12)
             .font('Helvetica')
             .fillColor('#64748b')
             .text('Nu exista tranzactii in aceasta perioada.', 50, doc.y);
        } else {
          // Table header with background
          const tableHeaderY = doc.y;
          doc.rect(50, tableHeaderY, doc.page.width - 100, 25)
             .fill(lightGray);

          doc.fillColor(textColor)
             .fontSize(10)
             .font('Helvetica-Bold');

          const colWidths = {
            date: 85,
            description: 180,
            type: 80,
            category: 100,
            amount: 90,
          };

          let x = 55;
          doc.text('Data', x, tableHeaderY + 8, { width: colWidths.date });
          x += colWidths.date;
          doc.text('Descriere', x, tableHeaderY + 8, { width: colWidths.description });
          x += colWidths.description;
          doc.text('Tip', x, tableHeaderY + 8, { width: colWidths.type });
          x += colWidths.type;
          doc.text('Categorie', x, tableHeaderY + 8, { width: colWidths.category });
          x += colWidths.category;
          doc.text('Suma (RON)', x, tableHeaderY + 8, { width: colWidths.amount, align: 'right' });

          doc.y = tableHeaderY + 30;

          // Table rows with alternating colors
          let rowIndex = 0;
          for (const transaction of transactions) {
            // Check if we need a new page
            if (doc.y > 700) {
              doc.addPage();
              doc.y = 50;
            }

            const rowY = doc.y;
            const rowHeight = 30;

            // Alternating row background
            if (rowIndex % 2 === 0) {
              doc.rect(50, rowY, doc.page.width - 100, rowHeight)
                 .fill('#fafafa');
            }

            doc.font('Helvetica')
               .fontSize(9)
               .fillColor(textColor);

            x = 55;
            
            // Date
            doc.text(
              new Date(transaction.date).toLocaleDateString('ro-RO'),
              x,
              rowY + 10,
              { width: colWidths.date }
            );
            
            // Description
            x += colWidths.date;
            doc.text(
              transaction.description || '-',
              x,
              rowY + 10,
              { width: colWidths.description, ellipsis: true }
            );
            
            // Type with color
            x += colWidths.description;
            const typeColor = transaction.type === 'income' ? successColor : dangerColor;
            doc.fillColor(typeColor)
               .text(
                 transaction.type === 'income' ? 'Venit' : 'Cheltuiala',
                 x,
                 rowY + 10,
                 { width: colWidths.type }
               );
            
            // Category
            x += colWidths.type;
            doc.fillColor(textColor)
               .text(
                 transaction.category.name,
                 x,
                 rowY + 10,
                 { width: colWidths.category, ellipsis: true }
               );
            
            // Amount
            x += colWidths.category;
            const amountColor = transaction.type === 'income' ? successColor : dangerColor;
            const amountPrefix = transaction.type === 'income' ? '+' : '-';
            doc.fillColor(amountColor)
               .font('Helvetica-Bold')
               .text(
                 `${amountPrefix}${transaction.amount.toFixed(2)}`,
                 x,
                 rowY + 10,
                 { width: colWidths.amount, align: 'right' }
               );

            doc.y = rowY + rowHeight;
            rowIndex++;
          }
        }

        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          
          doc.fontSize(8)
             .fillColor('#94a3b8')
             .font('Helvetica')
             .text(
               `Pagina ${i + 1} din ${pages.count}`,
               50,
               doc.page.height - 50,
               { align: 'center' }
             );
          
          doc.text(
            `Generat la: ${new Date().toLocaleString('ro-RO')}`,
            50,
            doc.page.height - 35,
            { align: 'center' }
          );
        }

        doc.end();
      });
    } catch (error) {
      console.error('Error in generatePDF:', error);
      throw error;
    }
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
        // Start from the beginning of the month
        const start = new Date(startDate);
        whereClause.date.gte = new Date(start.getFullYear(), start.getMonth(), 1);
      }
      if (endDate) {
        // Include the entire end month (last day at 23:59:59.999)
        const end = new Date(endDate);
        whereClause.date.lte = new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);
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
