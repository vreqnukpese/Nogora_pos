const net = require('net');
const PORT = 9100;

const server = net.createServer((socket) => {
  console.log('Printer connected! Receiving print job...\n');

  socket.on('data', (data) => {
    console.log('--- 🖨️ VIRTUAL TICKET OUTPUT ---');
    console.log(data.toString());
    console.log('-------------------------------\n');
  });

  socket.on('end', () => {
    console.log('Print job finished and connection closed.\n');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Virtual Thermal Printer running on 127.0.0.1:${PORT}`);
  console.log('Waiting for print jobs from your app...');
});
const { getNextTicketNumber, saveOrder } = require('./database');
const escpos = require('escpos');
escpos.Network = require('escpos-network');

// Simulate a customer order
const cartItems = [
  { name: 'Jollof Rice & Chicken', price: 45.00, qty: 1 },
  { name: 'Coca-Cola', price: 10.00, qty: 2 }
];
const totalAmount = 65.00;
const paymentMethod = 'CASH';

// 1. Get the dynamic sequence number for today from SQLite
getNextTicketNumber((err, nextNum) => {
  if (err) {
    console.error('Failed to get ticket number:', err);
    return;
  }

  // Generate date components for embedding (e.g., "0909" for Sep 9)
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Date-embedded format: #MMDD-XXX (e.g., #0909-001)
  const sequenceStr = String(nextNum).padStart(3, '0');
  const formattedTicketNo = `#${month}${day}-${sequenceStr}`;

  // 2. Save the order to SQLite
  saveOrder(nextNum, cartItems, totalAmount, paymentMethod, (err, orderId) => {
    if (err) {
      console.error('Failed to save order to database:', err);
      return;
    }

    console.log(`Order #${orderId} saved successfully with ticket number ${formattedTicketNo}`);

    // 3. Send to Virtual Printer
    const device = new escpos.Network('127.0.0.1');
    const printer = new escpos.Printer(device);

    device.open(function(error) {
      if (error) {
        console.error('Failed to connect to printer:', error);
        return;
      }

      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('NOGORA RESTAURANT')
        .text('--------------------------------')
        .align('lt')
        .style('normal')
        .text(`Ticket No: ${formattedTicketNo}`)
        .text(`Date: ${now.toLocaleDateString()}`)
        .text(`Payment: PAID - ${paymentMethod}`)
        .text('--------------------------------');

      cartItems.forEach(item => {
        printer.text(`${item.qty}x ${item.name} - GHS ${item.price.toFixed(2)}`);
      });

      printer
        .text('--------------------------------')
        .text(`TOTAL: GHS ${totalAmount.toFixed(2)}`)
        .text('--------------------------------')
        .align('ct')
        .style('b')
        .text('PLEASE KEEP TICKET FOR PICKUP')
        .style('normal')
        .cut()
        .close(() => {
          console.log('Ticket printed and job closed.');
        });
    });
  });
});