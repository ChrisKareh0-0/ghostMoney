const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');

async function exportToExcel(type, data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    // Style for header
    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00CC33' } },
        alignment: { vertical: 'middle', horizontal: 'center' }
    };

    switch (type) {
        case 'clients':
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Phone', key: 'phone', width: 20 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Balance', key: 'balance', width: 15 },
                { header: 'Notes', key: 'notes', width: 40 },
            ];
            worksheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
            data.forEach(client => {
                worksheet.addRow({
                    id: client.id,
                    name: client.name,
                    phone: client.phone || '',
                    email: client.email || '',
                    balance: `$${client.balance.toFixed(2)}`,
                    notes: client.notes || ''
                });
            });
            break;

        case 'products':
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Category', key: 'category_name', width: 20 },
                { header: 'Price', key: 'price', width: 15 },
                { header: 'Description', key: 'description', width: 40 },
            ];
            worksheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
            data.forEach(product => {
                worksheet.addRow({
                    id: product.id,
                    name: product.name,
                    category_name: product.category_name,
                    price: `$${product.price.toFixed(2)}`,
                    description: product.description || ''
                });
            });
            break;

        case 'transactions':
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Client', key: 'client_name', width: 25 },
                { header: 'Product', key: 'product_name', width: 25 },
                { header: 'Quantity', key: 'quantity', width: 12 },
                { header: 'Unit Price', key: 'unit_price', width: 15 },
                { header: 'Total', key: 'total_amount', width: 15 },
                { header: 'Date', key: 'created_at', width: 20 },
            ];
            worksheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
            data.forEach(transaction => {
                worksheet.addRow({
                    id: transaction.id,
                    client_name: transaction.client_name,
                    product_name: transaction.product_name,
                    quantity: transaction.quantity,
                    unit_price: `$${transaction.unit_price.toFixed(2)}`,
                    total_amount: `$${transaction.total_amount.toFixed(2)}`,
                    created_at: new Date(transaction.created_at).toLocaleString()
                });
            });
            break;

        case 'payments':
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Client', key: 'client_name', width: 25 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Method', key: 'payment_method', width: 15 },
                { header: 'Notes', key: 'notes', width: 30 },
                { header: 'Date', key: 'created_at', width: 20 },
            ];
            worksheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
            data.forEach(payment => {
                worksheet.addRow({
                    id: payment.id,
                    client_name: payment.client_name,
                    amount: `$${payment.amount.toFixed(2)}`,
                    payment_method: payment.payment_method || '',
                    notes: payment.notes || '',
                    created_at: new Date(payment.created_at).toLocaleString()
                });
            });
            break;
    }

    // Save file
    const { filePath } = await dialog.showSaveDialog({
        title: `Export ${type} to Excel`,
        defaultPath: path.join(app.getPath('documents'), `${type}_${Date.now()}.xlsx`),
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return filePath;
    }
    throw new Error('Export cancelled');
}

async function exportToPDF(type, data) {
    const { filePath } = await dialog.showSaveDialog({
        title: `Export ${type} to PDF`,
        defaultPath: path.join(app.getPath('documents'), `${type}_${Date.now()}.pdf`),
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (!filePath) {
        throw new Error('Export cancelled');
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).fillColor('#00CC33').text(`${type.toUpperCase()} REPORT`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Content
    doc.fontSize(10).fillColor('#000000');

    switch (type) {
        case 'clients':
            data.forEach((client, index) => {
                if (index > 0) doc.moveDown();
                doc.fillColor('#00CC33').text(`${client.name}`, { continued: true });
                doc.fillColor('#000000').text(` - Balance: $${client.balance.toFixed(2)}`);
                if (client.phone) doc.text(`Phone: ${client.phone}`);
                if (client.email) doc.text(`Email: ${client.email}`);
                if (client.notes) doc.text(`Notes: ${client.notes}`);
                doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
            });
            break;

        case 'products':
            data.forEach((product, index) => {
                if (index > 0) doc.moveDown();
                doc.fillColor('#00CC33').text(`${product.name}`, { continued: true });
                doc.fillColor('#000000').text(` - $${product.price.toFixed(2)}`);
                doc.text(`Category: ${product.category_name}`);
                if (product.description) doc.text(`Description: ${product.description}`);
                doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
            });
            break;

        case 'transactions':
            data.forEach((transaction, index) => {
                if (index > 0) doc.moveDown();
                doc.fillColor('#00CC33').text(`${transaction.client_name}`, { continued: true });
                doc.fillColor('#000000').text(` - ${transaction.product_name}`);
                doc.text(`Quantity: ${transaction.quantity} x $${transaction.unit_price.toFixed(2)} = $${transaction.total_amount.toFixed(2)}`);
                doc.text(`Date: ${new Date(transaction.created_at).toLocaleString()}`);
                doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
            });
            break;

        case 'payments':
            data.forEach((payment, index) => {
                if (index > 0) doc.moveDown();
                doc.fillColor('#00CC33').text(`${payment.client_name}`, { continued: true });
                doc.fillColor('#000000').text(` - $${payment.amount.toFixed(2)}`);
                if (payment.payment_method) doc.text(`Method: ${payment.payment_method}`);
                if (payment.notes) doc.text(`Notes: ${payment.notes}`);
                doc.text(`Date: ${new Date(payment.created_at).toLocaleString()}`);
                doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#CCCCCC');
            });
            break;
    }

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

module.exports = { exportToExcel, exportToPDF };
