const escpos = require('escpos');
escpos.Network = require('escpos-network');

// Pointing to our local virtual printer emulator
const device = new escpos.Network('127.0.0.1');
const printer = new escpos.Printer(device);

device.open(function(error) {
  if (error) {
    console.error('Failed to connect to printer:', error);
    return;
  }

  console.log('Connected to printer successfully!');

  printer
    .font('a')
    .align('ct')
    .style('bu')
    .size(1, 1)
    .text('NOGORA RESTAURANT')
    .text('--------------------------------')
    .align('lt')
    .style('normal')
    .text('Ticket No: #001')
    .text('Payment: PAID - CASH')
    .text('--------------------------------')
    .text('1x Jollof Rice & Chicken')
    .text('1x Coca-Cola')
    .text('--------------------------------')
    .align('ct')
    .style('b')
    .text('PLEASE KEEP TICKET FOR PICKUP')
    .style('normal')
    .cut()
    .close(function() {
      console.log('Print job sent successfully.');
    });
});

