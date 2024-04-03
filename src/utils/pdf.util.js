import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generatePdf = async (ticket, user, products) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const {  height } = page.getSize();
    const fontSize = 12;
    const margin = 50;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // Crear el contenido del ticket
    const ticketContent = `
        Ticket de Compra
        Código de Ticket: ${ticket.code}
        Fecha de Compra: ${ticket.purchase_datetime.toLocaleString()}
        Monto Total: $${ticket.amount.toFixed(2)}
        Comprador: ${user.name} ${user.lastname}
        Productos: ${products.map(p => p.name).join(', ')}
    `;

    const lines = ticketContent.split('\n');

    // Calcular la altura total del texto
    const lineHeight = font.heightAtSize(fontSize);
    const textHeight = lineHeight * lines.length;

    // Calcular la posición y el espacio disponible para el texto
    const startY = height - margin - textHeight;

    // Dibujar el texto en la página
    page.drawText(ticketContent, {
        x: margin,
        y: startY,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    return pdfBytes;
};