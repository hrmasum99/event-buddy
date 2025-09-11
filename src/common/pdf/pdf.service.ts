// import { Injectable } from '@nestjs/common';
// import PdfPrinter from 'pdfmake';
// import * as fs from 'fs';
// import * as path from 'path';
// import QRCode from 'qrcode';

// @Injectable()
// export class PdfService {
//   private fonts: any;
//   private printer: any;

//   constructor() {
//     this.fonts = {
//       Roboto: {
//         normal: path.join(
//           process.cwd(),
//           'src/common/pdf/assets/fonts/Roboto-Regular.ttf',
//         ),
//         bold: path.join(
//           process.cwd(),
//           'src/common/pdf/assets/fonts/Roboto-Bold.ttf',
//         ),
//       },
//     };
//     this.printer = new PdfPrinter(this.fonts);
//   }

//   async generateInvoice(order: any): Promise<Buffer> {
//     const logoPath = path.join(
//       process.cwd(),
//       'src/common/pdf/assets/event-buddy-logo.svg',
//     );
//     const logo = fs.existsSync(logoPath)
//       ? fs.readFileSync(logoPath).toString('base64')
//       : null;

//     const qrData = await QRCode.toDataURL(`Order ID: ${order.id}`);

//     const docDefinition = {
//       content: [
//         logo
//           ? {
//               image: `data:image/png;base64,${logo}`,
//               width: 100,
//               alignment: 'center',
//             }
//           : {},
//         { text: 'INVOICE', style: 'header' },
//         { text: `Invoice #${order.id}`, style: 'subheader' },
//         { text: `Customer: ${order.customer}`, margin: [0, 10, 0, 5] },
//         { text: `Amount: $${order.amount}`, margin: [0, 0, 0, 15] },
//         { qr: `Order:${order.id}`, fit: 100, alignment: 'right' },
//       ],
//       styles: {
//         header: {
//           fontSize: 22,
//           bold: true,
//           alignment: 'center',
//           margin: [0, 10, 0, 10],
//         },
//         subheader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
//       },
//       pageMargins: [40, 60, 40, 60],
//     };

//     const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
//     return this.bufferFromStream(pdfDoc);
//   }

//   async generateTicket(event: any, user: any): Promise<Buffer> {
//     const bgPath = path.join(
//       process.cwd(),
//       'src/common/pdf/assets/event-bg.jpg', // this images will be came from cloudinary
// // here is code for get image from cloudinary by eventid
// // @Get('/image/:id')
// //   @ApiOperation({ summary: 'Get event image (redirects to Cloudinary URL)' })
// //   @ApiOkResponse({ description: 'Redirects to image URL' })
// //   @ApiNotFoundResponse({ description: 'Event or image not found' })
// //   @Redirect()
// //   async getEventImage(
// //     @Param('id', ParseIntPipe) id: number,
// //   ): Promise<{ url: string }> {
// //     const imageUrl = await this.eventsService.getEventImage(id);
// //     return { url: imageUrl };
// //   }
// // async getEventImage(id: number): Promise<string> {
// //     const event = await this.eventsRepo.findOne({ where: { id } });
// //     if (!event) {
// //       throw new NotFoundException(`Event with ID ${id} not found`);
// //     }

// //     if (!event.imageUrl) {
// //       throw new NotFoundException(`No image found for event ID ${id}`);
// //     }

// //     return event.imageUrl;
// //   }
//     );
//     const background = fs.existsSync(bgPath)
//       ? fs.readFileSync(bgPath).toString('base64')
//       : null;

//     const qrData = await QRCode.toDataURL(
//       `${event.title} | ${user.fullname} | ${user.email}`,
//     );

//     const docDefinition = {
//       background: background
//         ? {
//             image: `data:image/jpeg;base64,${background}`,
//             width: 600,
//             opacity: 0.2,
//           }
//         : {},
//       content: [
//         { text: event.title, style: 'title' },
//         { text: `Date: ${event.date}`, style: 'info' },
//         { text: `Location: ${event.location}`, style: 'info' },
//         { text: `Name: ${user.fullname}`, style: 'info' },
//         { text: `Email: ${user.email}`, style: 'info' },
//         {
//           qr: `${event.title}|${user.fullname}|${user.email}`,
//           fit: 120,
//           alignment: 'center',
//           margin: [0, 30, 0, 0],
//         },
//       ],
//       styles: {
//         title: {
//           fontSize: 24,
//           bold: true,
//           alignment: 'center',
//           color: 'white',
//           margin: [0, 50, 0, 20],
//         },
//         info: {
//           fontSize: 14,
//           alignment: 'center',
//           color: 'white',
//           margin: [0, 5, 0, 5],
//         },
//       },
//       pageMargins: [40, 60, 40, 60],
//     };

//     const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
//     return this.bufferFromStream(pdfDoc);
//   }

//   private bufferFromStream(pdfDoc): Promise<Buffer> {
//     return new Promise((resolve, reject) => {
//       const chunks: any[] = [];
//       pdfDoc.on('data', (chunk) => chunks.push(chunk));
//       pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
//       pdfDoc.on('error', reject);
//       pdfDoc.end();
//     });
//   }
// }

import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import axios from 'axios';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { ObjectId } from 'typeorm';

type FontDict = {
  [family: string]: {
    normal: string;
    bold: string;
    italics: string;
    bolditalics: string;
  };
};

@Injectable()
export class PdfService {
  private printer: PdfPrinter;

  constructor(private readonly cloudinaryService: CloudinaryService) {
    const fonts: FontDict = {
      Roboto: {
        normal: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/Roboto-Regular.ttf',
        ),
        bold: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/Roboto-Bold.ttf',
        ),
        italics: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/Roboto-Italic.ttf',
        ),
        bolditalics: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/Roboto-BoldItalic.ttf',
        ),
      },
      Noto: {
        normal: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/NotoSansBengali-Regular.ttf',
        ),
        bold: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/NotoSansBengali-Bold.ttf',
        ),
        italics: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/NotoSansBengali-Regular.ttf',
        ),
        bolditalics: path.join(
          process.cwd(),
          'src/common/pdf/assets/fonts/NotoSansBengali-Bold.ttf',
        ),
      },
    };

    this.printer = new PdfPrinter(fonts as any);
  }

  private async imageUrlToBase64(url: string): Promise<string | null> {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const mime = res.headers['content-type']; // e.g. image/png, image/svg+xml
      const base64 = Buffer.from(res.data, 'binary').toString('base64');
      return `data:${mime};base64,${base64}`;
    } catch (err) {
      console.error('Failed to fetch remote image:', url, err.message);
      return null;
    }
  }

  private bufferFromDoc(docDefinition: any): Promise<Buffer> {
    const doc = this.printer.createPdfKitDocument(docDefinition);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  // ---------- Invoice ----------
  async generateInvoiceBuffer(order: {
    id: string | number;
    customer: string;
    amount: number | string;
    billTo: string;
    billFrom: string;
    date: string;
    items: { name: string; qty: number; price: string; total: string }[];
    invoiceNo: string;
  }): Promise<Buffer> {
    const logoUrl =
      'https://res.cloudinary.com/dlzytq9a2/image/upload/v1757044681/event-buddy-logo_udutxn.png';
    const logoB64 = await this.imageUrlToBase64(logoUrl);

    const qrPayload = `INVOICE|${order.id}|${order.customer}|${order.amount}`;

    const currentDate = new Date();
    const year = currentDate.getFullYear();

    const itemRows = order.items.map((it, i) => [
      { text: `${i + 1}`, alignment: 'center' },
      { text: it.name },
      { text: `${it.qty}`, alignment: 'center' },
      { text: `৳${it.price}`, alignment: 'left', font: 'Noto' },
      { text: `৳${it.total}`, alignment: 'left', font: 'Noto' },
    ]);

    const docDefinition = {
      pageSize: 'A5',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            [
              logoB64
                ? {
                    image: logoB64,
                    width: 100,
                    alignment: 'left',
                    margin: [0, 0, 0, 10],
                  }
                : {},
            ],
            [
              {
                text: 'INVOICE',
                style: 'header',
                alignment: 'right',
                margin: [0, 0, 0, 10],
              },
            ],
          ],
        },
        {
          columns: [
            [
              { text: `Invoice No#: ${order.invoiceNo}`, style: 'subheader' },
              { text: `Date: ${order.date}` },
              { text: ' ', margin: [0, 3] },
              { qr: qrPayload, fit: 100, alignment: 'left' },
              {
                text: 'Scan QR for verification',
                alignment: 'left',
                italics: true,
                margin: [0, 5, 0, 3],
              },
            ],
            [
              { text: 'BILL FROM:', style: 'subheader' },
              { text: order.billFrom },
              { text: 'BILL TO:', style: 'subheader', margin: [0, 10, 0, 0] },
              { text: order.billTo },
            ],
          ],
        },
        { text: ' ', margin: [0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: '#', style: 'tableHeader' },
                { text: 'Item', style: 'tableHeader' },
                { text: 'Qty', style: 'tableHeader' },
                { text: 'Price', style: 'tableHeader' },
                { text: 'Total', style: 'tableHeader' },
              ],
              ...itemRows,
            ],
            style: 'table',
          },
          margin: [0, 0, 0, 5],
        },
        { text: ' ', margin: [0, 5] },
        {
          columns: [
            { text: '' },
            {
              stack: [
                {
                  text: `Subtotal: ৳${order.amount}`,
                  alignment: 'right',
                  font: 'Noto',
                },
                {
                  text: `Total Paid: ৳${order.amount}`,
                  bold: true,
                  alignment: 'right',
                  font: 'Noto',
                },
                {
                  text: `Total Due: ৳      0`,
                  bold: true,
                  alignment: 'right',
                  font: 'Noto',
                },
              ],
            },
          ],
        },
        { text: ' ', margin: [0, 5] },
        {
          text: 'Terms & Conditions',
          style: 'subheaderbold',
        },
        {
          ul: [
            'All sales are subject to our standard refund and cancellation policy.',
            'Refunds are only eligible if cancellation is made at least 24 hours before the event.',
            'This invoice serves as proof of purchase and must be retained for any support or queries.',
            'Prices include applicable taxes unless otherwise stated.',
          ],
          fontSize: 6,
          margin: [0, 5, 0, 5],
        },
        {
          text: 'Thank you again for choosing Event Buddy. We look forward to serving you in the future!',
          alignment: 'center',
          style: 'invoiceInfobold',
          margin: [0, 10, 0, 5],
        },
      ],
      // ✅ Footer section
      footer: {
        stack: [
          {
            text: `POWERED BY`,
            style: 'invoiceInfobold',
            alignment: 'center',
          },
          {
            image: logoB64,
            width: 80,
            alignment: 'center',
            margin: [0, 0, 0, 2],
          },
          {
            text: `© ${year} Event buddy. All rights reserved.`,
            style: 'invoiceInfosmall',
            alignment: 'center',
          },
        ],
        margin: [0, 0, 0, 0], // spacing above footer
      },
      styles: {
        header: {
          fontSize: 22,
          bold: true,
        },
        subheader: { fontSize: 12, bold: true, margin: [0, 5, 0, 5] },
        subheaderbold: { fontSize: 8, bold: true, margin: [0, 2, 0, 2] },
        tableHeader: { bold: true, fillColor: '#eeeeee', alignment: 'center' },
        table: { fontSize: 11 },
        invoiceInfo: { fontSize: 7, margin: [0, 2, 0, 2] },
        invoiceInfosmall: { fontSize: 5, margin: [0, 2, 0, 2] },
        invoiceInfobold: { fontSize: 6, bold: true, margin: [0, 2, 0, 2] },
      },
    };

    return this.bufferFromDoc(docDefinition);
  }

  async uploadInvoiceToCloudinary(
    buffer: Buffer,
    paymentId: number,
    dateString: string,
    randomNum: number,
  ): Promise<string> {
    const invoiceNo = `INV${paymentId}-${dateString}${randomNum}`;
    const result = await this.cloudinaryService.uploadBuffer(
      buffer,
      'event-buddy/invoices',
      `${invoiceNo}`,
      'raw',
    );
    return result.secure_url;
  }

  // ---------- Ticket ----------
  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'];
    return `data:${mimeType};base64,${base64}`;
  }

  async generateTicketBuffer(
    event: {
      id: number | string;
      title: string;
      date: string | Date;
      location: string;
      price: number;
      imageUrl: string;
      ticketNo: string;
      qty: number;
    },
    user: { fullname: string; email: string },
  ): Promise<Buffer> {
    const logoUrl =
      'https://res.cloudinary.com/dlzytq9a2/image/upload/v1757044681/event-buddy-logo_udutxn.png';
    const logoB64 = await this.imageUrlToBase64(logoUrl);

    let bgImage: string | undefined = undefined;
    if (event.imageUrl) {
      bgImage = await this.fetchImageAsBase64(event.imageUrl);
    }

    // ✅ Generate QR Code
    const tktQRPayload = `TICKET|${event.title}|${event.date}|${user.fullname}|${user.email}`;

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    // const qrData = `Event: ${event.title}\nUser: ${user.fullname}\nEmail: ${user.email}`;
    // const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    const docDefinition: TDocumentDefinitions = {
      pageSize: { width: 432, height: 180 }, // 6in x 2.5in
      pageMargins: [10, 10, 10, 10],
      background: bgImage
        ? [{ image: bgImage, width: 432, height: 180, opacity: 0.2 }]
        : undefined,
      content: [
        {
          columns: [
            {
              width: '70%', // left column
              stack: [
                {
                  columns: [
                    { width: '80%', text: event.title, style: 'ticketTitle' },

                    {
                      width: '20%',
                      stack: [
                        {
                          text: `PRICE:`,
                          alignment: 'left',
                          style: 'ticketInfobold',
                        },
                        {
                          text: `৳${event.price}`,
                          bold: true,
                          alignment: 'left',
                          style: 'ticketInfobold',
                          font: 'Noto',
                        },
                      ],
                    },
                  ],
                },
                {
                  columns: [
                    { text: `DATE: ${event.date}`, style: 'ticketInfo' },

                    {
                      text: `TIME: ${new Date(event.date).toLocaleTimeString()}`,
                      style: 'ticketInfo',
                    },
                    ,
                    {
                      width: '25%',
                      text: `QUANTITY: x${event.qty}`,
                      alignment: 'left',
                      style: 'ticketInfobold',
                    },
                  ],
                },
                {
                  text: `ADDRESS: ${event.location}`,
                  style: 'ticketInfoAddress',
                },
                {
                  text: `OWNER NAME: ${user.fullname}`,
                  style: 'ticketInfo',
                  bold: true,
                },
                { text: `OWNER EMAIL: ${user.email}`, style: 'ticketInfo' },
                { text: '', margin: [0, 5, 0, 0] },
                {
                  text: `POWERED BY`,
                  style: 'ticketInfo',
                  alignment: 'center',
                  bold: true,
                  margin: [0, 5, 0, 0],
                },
                {
                  image: logoB64,
                  width: 100,
                  alignment: 'center',
                  margin: [0, 0, 0, 2],
                },
                {
                  text: `© ${year} Event buddy. All rights reserved.`,
                  style: 'ticketInfosmall',
                  alignment: 'center',
                },
              ],
            },
            {
              width: '3%',
              canvas: [
                {
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 160,
                  dash: { length: 3, space: 3 },
                  lineWidth: 1,
                  lineColor: '#888',
                },
              ],
            },
            {
              width: '27%', // right column
              stack: [
                { text: `TICKET NO# ${event.ticketNo}`, style: 'ticketInfo' },
                {
                  text: 'Scan QR for verification',
                  style: 'ticketInfo',
                  alignment: 'center',
                  italics: true,
                  margin: [0, 5, 0, 3],
                },
                {
                  qr: tktQRPayload,
                  fit: 50,
                  alignment: 'center',
                },
                { text: event.title, style: 'ticketHeader' },
                {
                  text: `OWNER NAME: ${user.fullname}`,
                  style: 'ticketInfosmall',
                  alignment: 'center',
                  bold: true,
                },
                {
                  text: `QUANTITY: x${event.qty}`,
                  alignment: 'center',
                  style: 'ticketInfosmall',
                },
              ],
            },
          ],
        },
      ],
      styles: {
        ticketTitle: { fontSize: 20, bold: true, margin: [0, 0, 0, 5] },
        ticketHeader: { fontSize: 11, bold: true, margin: [0, 2, 0, 2] },
        ticketInfo: { fontSize: 7, margin: [0, 2, 0, 2] },
        ticketInfobold: { fontSize: 10, margin: [0, 2, 0, 2] },
        ticketInfosmall: { fontSize: 5, margin: [0, 2, 0, 2] },
        ticketInfoAddress: { fontSize: 6 },
      },
    };

    return this.bufferFromDoc(docDefinition);
  }

  async uploadTicketToCloudinary(
    buffer: Buffer,
    paymentId: number,
    dateString: string,
    randomNum: number,
  ): Promise<string> {
    const ticketNo = `TKT${paymentId}-${dateString}${randomNum}`;

    const result = await this.cloudinaryService.uploadBuffer(
      buffer,
      'event-buddy/tickets',
      `${ticketNo}`,
      'raw',
    );
    return result.secure_url;
  }

  // async generateTicketCloudinary(
  //   event: {
  //     id: number | string;
  //     title: string;
  //     date: string | Date;
  //     location: string;
  //     backgroundUrl?: string | null;
  //   },
  //   user: { fullname: string; email: string },
  // ): Promise<string> {
  //   const buffer = await this.generateTicketBuffer(event, user);
  //   const uploaded = await this.cloudinary.uploadBuffer(
  //     buffer,
  //     'event-buddy/tickets',
  //     `ticket-${event.id}-${user.email.replace(/[^a-z0-9]/gi, '')}`,
  //     'raw',
  //   );
  //   return uploaded.secure_url;
  // }
}
