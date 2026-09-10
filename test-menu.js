const { getAllProducts } = require('./database');

getAllProducts((err, products) => {
  if (err) {
    console.error('Error fetching menu:', err);
    return;
  }

  console.log('--- 📋 RESTAURANT MENU FROM SQLITE ---');
  products.forEach(p => {
    console.log(`[${p.category}] ${p.name} - GHS ${p.price.toFixed(2)}`);
  });
  console.log('--------------------------------------');
});