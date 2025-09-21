(async () => {
  const base = 'http://localhost:3000';
  const headers = { 'Content-Type': 'application/json', 'x-bot-key': 'supersemar1998' };
  const fetchJson = async (url, opts) => {
    const res = await fetch(url, opts);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { json = text; }
    return { status: res.status, body: json };
  };

  try {
    console.log('1) Create/get customer {no_hp:1111,nama:xyz}');
    let r = await fetchJson(base + '/api/bot/customer', {
      method: 'POST', headers, body: JSON.stringify({ no_hp: '1111', nama: 'xyz' })
    });
    console.log('=>', r.status, r.body);

    console.log('2) Create/get pending order for customer 1111');
    r = await fetchJson(base + '/api/bot/order', { method: 'POST', headers, body: JSON.stringify({ no_hp: '1111' }) });
    console.log('=>', r.status, r.body);
    const order = r.body;
    if (!order || !order.no_transaksi) throw new Error('Order creation failed');
    const no_transaksi = order.no_transaksi;

    // get products to find banner product or use id 1
    console.log('3) Get products (to pick ids)');
    r = await fetchJson(base + '/api/bot/products', { method: 'GET', headers });
    console.log('=>', r.status, Array.isArray(r.body) ? `${r.body.length} products` : r.body);
    let products = Array.isArray(r.body) ? r.body : [];
    let product1 = products.find(p => p.id_produk === 1) || products[0];
    if (!product1) {
      throw new Error('No products available; create products first');
    }
    // find banner-like product
    let banner = products.find(p => /(banner|backdrop|x-banner)/i.test(p.nama_produk)) || product1;

    console.log('4) Add order details: product id', product1.id_produk, 'qty 10 and banner id', banner.id_produk, 'qty 1');
    const orderDetailsPayload = {
      no_transaksi,
      order_details: [
        { id_product: product1.id_produk, qty: 10 },
        // send dimension for banner as 3x3 meters so server can compute harga_per_m2
        { id_product: banner.id_produk, qty: 1, size: '3x3m' }
      ]
    };
    r = await fetchJson(base + '/api/bot/order-detail', { method: 'POST', headers, body: JSON.stringify(orderDetailsPayload) });
    console.log('=>', r.status, r.body);

    console.log('5) Fetch pending order by phone to get totals');
    r = await fetchJson(base + '/api/bot/order-by-phone?no_hp=1111', { method: 'GET', headers });
    console.log('=>', r.status, r.body);
    if (r.status !== 200) throw new Error('Failed to fetch order-by-phone');
    const totalBayar = Number(r.body.order.total_bayar || 0);
    console.log('Total bayar for order:', totalBayar);

    const dpNominal = Math.round(totalBayar * 0.3);
    console.log('6) Create payment (dp 30%) -> nominal =', dpNominal);
    // bot payment expects no_transaksi and link_bukti and no_hp; it derives nominal from order.nominal; to simulate we send link_bukti and rely on server to set nominal
    r = await fetchJson(base + '/api/bot/payment', { method: 'POST', headers, body: JSON.stringify({ no_transaksi, link_bukti: 'http://example.com/bukti.jpg', no_hp: '1111' }) });
    console.log('=>', r.status, r.body);

    console.log('7) Get payments for phone 1111');
    r = await fetchJson(base + '/api/bot/payment?no_hp=1111', { method: 'GET', headers });
    console.log('=>', r.status, r.body);

    console.log('\nFlow complete');
  } catch (err) {
    console.error('Flow error:', err);
    process.exit(1);
  }
})();
