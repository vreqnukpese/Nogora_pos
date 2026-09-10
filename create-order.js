const { db, getNextTicketNumber, saveOrder } = require('./database');
const escpos = require('escpos');
escpos.Network = require('escpos-network');

// Define the cart items for this test order using our database product_ids
const orderedItems = [
  { product_id: 'jollof_chicken', qty: 1 },
  { product_id: 'indomie_mixed', qty: 1 },
  { product_id: 'coca_cola', qty: 2 }
];
const paymentMethod = 'CASH';

// 1. Fetch product details from the database for the items in the cart
const placeholders = orderedItems.map(() => '?').join(',');
const productIds = orderedItems.map(i => i.product_id);

db.all(`SELECT * FROM products WHERE product_id IN (${placeholders})`, productIds, (err, products) => {
  if (err) {
    console.error('Failed to fetch product details:', err);
    return;
  }

  // Map ordered items with their fetched names and prices
  let totalAmount = 0;
  const cartItems = orderedItems.map(orderItem => {
    const product = products.find(p => p.product_id === orderItem.product_id);
    const itemTotal = product.price * orderItem.qty;
    totalAmount += itemTotal;
    return {
      name: product.name,
      price: product.price,
      qty: orderItem.qty,
      total: itemTotal
    };
  });

  // 2. Get the next sequence number for today from SQLite
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

    // 3. Save the order to SQLite
    saveOrder(nextNum, cartItems, totalAmount, paymentMethod, (err, orderId) => {
      if (err) {
        console.error('Failed to save order to database:', err);
        return;
      }

      console.log(`Order #${orderId} saved successfully with ticket number ${formattedTicketNo} (Total: GHS ${totalAmount.toFixed(2)})`);

      // 4. Send to Virtual Printer
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
          printer.text(`${item.qty}x ${item.name} - GHS ${item.total.toFixed(2)}`);
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
});