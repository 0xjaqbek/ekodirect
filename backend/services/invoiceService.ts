// backend/services/invoiceService.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatDate, formatPrice } from '../shared/utils';
import { type Order, type User } from '../types';

export interface InvoiceOptions {
  order: Order;
  user: User;
}

class InvoiceService {
  /**
   * Generate an invoice PDF for an order
   */
  async generateInvoice(options: InvoiceOptions): Promise<Buffer> {
    const { order, user } = options;
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a new page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    
    // Get the standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Define colors
    const primaryColor = rgb(0.18, 0.49, 0.196); // #2E7D32
    const textColor = rgb(0.2, 0.2, 0.2);
    
    // Set margins
    const margin = 50;
    const width = page.getWidth() - 2 * margin;
    
    // Current y position (from top)
    let y = page.getHeight() - margin;
    
    // Draw header
    page.drawText('EkoDirect', {
      x: margin,
      y,
      font: fontBold,
      size: 24,
      color: primaryColor
    });
    
    y -= 20;
    
    page.drawText('Faktura VAT', {
      x: margin,
      y,
      font: fontBold,
      size: 16,
      color: textColor
    });
    
    // Draw invoice number and date
    y -= 40;
    
    page.drawText(`Numer faktury: FV/${order._id.substring(0, 8).toUpperCase()}`, {
      x: margin,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 20;
    
    page.drawText(`Data wystawienia: ${formatDate(new Date())}`, {
      x: margin,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 20;
    
    page.drawText(`Data sprzedaży: ${formatDate(order.createdAt)}`, {
      x: margin,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    // Draw seller and buyer info
    y -= 40;
    
    // Seller
    page.drawText('Sprzedawca:', {
      x: margin,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    y -= 20;
    
    page.drawText('EkoDirect Sp. z o.o.', {
      x: margin,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 15;
    
    page.drawText('ul. Ekologiczna 1', {
      x: margin,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 15;
    
    page.drawText('00-000 Warszawa', {
      x: margin,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 15;
    
    page.drawText('NIP: 000-000-00-00', {
      x: margin,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    // Buyer
    y = page.getHeight() - margin - 40 - 20;
    
    page.drawText('Nabywca:', {
      x: margin + width / 2,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    y -= 20;
    
    page.drawText(user.fullName, {
      x: margin + width / 2,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 15;
    
    page.drawText(order.shippingAddress.street, {
      x: margin + width / 2,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 15;
    
    page.drawText(`${order.shippingAddress.postalCode} ${order.shippingAddress.city}`, {
      x: margin + width / 2,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    // Draw items table
    y -= 60;
    
    // Table header
    page.drawText('LP', {
      x: margin,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    page.drawText('Nazwa', {
      x: margin + 30,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    page.drawText('Ilość', {
      x: margin + 280,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    page.drawText('Cena jedn.', {
      x: margin + 350,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    page.drawText('Wartość', {
      x: margin + 450,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    // Draw line
    y -= 10;
    
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + width, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    // Table rows
    y -= 20;
    
    order.items.forEach((item, index) => {
      // Get product name
      const productName = typeof item.product === 'string' 
        ? `Produkt ${item.product.substring(0, 8)}` 
        : item.product.name;
      
      page.drawText((index + 1).toString(), {
        x: margin,
        y,
        font: font,
        size: 12,
        color: textColor
      });
      
      page.drawText(productName, {
        x: margin + 30,
        y,
        font: font,
        size: 12,
        color: textColor
      });
      
      page.drawText(item.quantity.toString(), {
        x: margin + 280,
        y,
        font: font,
        size: 12,
        color: textColor
      });
      
      page.drawText(formatPrice(item.priceAtPurchase), {
        x: margin + 350,
        y,
        font: font,
        size: 12,
        color: textColor
      });
      
      page.drawText(formatPrice(item.priceAtPurchase * item.quantity), {
        x: margin + 450,
        y,
        font: font,
        size: 12,
        color: textColor
      });
      
      y -= 20;
    });
    
    // Draw line
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + width, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    // Draw totals
    y -= 30;
    
    // Calculate shipping cost (free shipping over 100 PLN)
    const shippingCost = order.totalPrice >= 100 ? 0 : 15;
    
    page.drawText('Wartość produktów:', {
      x: margin + 300,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    page.drawText(formatPrice(order.totalPrice), {
      x: margin + 450,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 20;
    
    page.drawText('Koszt dostawy:', {
      x: margin + 300,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    page.drawText(shippingCost === 0 ? 'Darmowa' : formatPrice(shippingCost), {
      x: margin + 450,
      y,
      font: font,
      size: 12,
      color: textColor
    });
    
    y -= 20;
    
    page.drawText('Razem do zapłaty:', {
      x: margin + 300,
      y,
      font: fontBold,
      size: 12,
      color: textColor
    });
    
    page.drawText(formatPrice(order.totalPrice + shippingCost), {
      x: margin + 450,
      y,
      font: fontBold,
      size: 12,
      color: primaryColor
    });
    
    // Draw carbon footprint info
    y -= 60;
    
    if (order.carbonFootprint) {
      page.drawText('Informacje o śladzie węglowym:', {
        x: margin,
        y,
        font: fontBold,
        size: 12,
        color: textColor
      });
      
      y -= 20;
      
      page.drawText(`Ślad węglowy tego zamówienia: ${order.carbonFootprint.toFixed(2)} kg CO₂`, {
        x: margin,
        y,
        font: font,
        size: 12,
        color: textColor
      });
    }
    
    // Draw footer
    y = margin + 30;
    
    page.drawText('Dziękujemy za zakupy w EkoDirect!', {
      x: margin,
      y,
      font: fontBold,
      size: 12,
      color: primaryColor
    });
    
    // Serialize PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;