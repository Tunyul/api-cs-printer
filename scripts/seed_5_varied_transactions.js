// scripts/seed_5_varied_transactions.js
// Run with: node scripts/seed_5_varied_transactions.js

const models = require('../src/models');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTransactionNumber(name) {
  const date = new Date();
  const day = String(date.getDate()).padStart(2,'0');
  const month = String(date.getMonth()+1).padStart(2,'0');
  const year = date.getFullYear();
  const random = Math.floor(Math.random()*9000)+1000;
  const namePart = (name || 'CUST').split(' ')[0].toUpperCase().slice(0,6);
  return `TRX-${day}${month}${year}-${random}-${namePart}`;
}

async function ensureOneProduct() {
  const p = await models.Product.findOne();
  if (p) return p;
  return models.Product.create({ kategori: 'Cetak', nama_produk: 'Produk Seed Var', bahan: 'Karton', finishing: 'Matte', ukuran_standar: 'pcs', harga_per_pcs: 40000, unit_area: null, waktu_proses: '1 hari', created_at: new Date(), updated_at: new Date(), stock: 20 });
}

async function ensureCustomer() {
  const c = await models.Customer.findOne();
  if (c) return c;
  const nama = 'VarSeed Customer';
  const no_hp = '6288900000000';
  return models.Customer.create({ nama, no_hp, tipe_customer: 'reguler', batas_piutang: null, catatan: '', created_at: new Date(), updated_at: new Date() });
}

async function main() {
  try {
    await models.sequelize.authenticate();
    console.log('DB connected');

    const product = await ensureOneProduct();
    const customer = await ensureCustomer();

    const created = [];

    // Define 5 scenarios
    const scenarios = [
      { paymentStatus: 'pending', paymentShare: 0 }, // no payment yet
      { paymentStatus: 'menunggu_verifikasi', paymentShare: 0.5 }, // half, waiting verification
      { paymentStatus: 'verified', paymentShare: 1.0 }, // full verified
      { paymentStatus: 'confirmed', paymentShare: 1.0, multiPayments: true }, // dp + pelunasan confirmed
      { paymentStatus: 'pending', paymentShare: 0.2, piutangStatus: 'terlambat', makeLate: true } // partial and late
    ];

    for (let i=0;i<scenarios.length;i++) {
      const sc = scenarios[i];
      await models.sequelize.transaction(async (t) => {
        const no_transaksi = generateTransactionNumber(customer.nama + i);
        const tanggal_order = new Date(Date.now() - (sc.makeLate ? 20 : 0) * 24*3600*1000);

        const order = await models.Order.create({ id_customer: customer.id_customer, no_transaksi, tanggal_order, status_urgensi: 'normal', total_bayar: 0, dp_bayar: 0, status_bayar: 'belum_lunas', tanggal_jatuh_tempo: new Date(Date.now()+7*24*3600*1000), link_invoice: '', link_drive: '', status_order: 'pending', total_harga: 0, status: 'pending', catatan: '', status_bot: 'pending', created_at: new Date(), updated_at: new Date() }, { transaction: t });

        // create 1-2 details
        const detailCount = randInt(1,2);
        let totalHarga = 0;
        for (let d=0; d<detailCount; d++) {
          const qty = randInt(1,3);
          const harga_satuan = Number(product.harga_per_pcs || 0);
          const subtotal_item = harga_satuan * qty;
          await models.OrderDetail.create({ id_order: order.id_order, id_produk: product.id_produk, quantity: qty, harga_satuan, subtotal_item, created_at: new Date(), updated_at: new Date() }, { transaction: t });
          totalHarga += subtotal_item;
        }
        await order.update({ total_bayar: totalHarga, total_harga: totalHarga }, { transaction: t });

        // create payments according to scenario
        if (sc.multiPayments) {
          // create DP then pelunasan
          const dp = Math.round(totalHarga * 0.3);
          await models.Payment.create({ id_order: order.id_order, id_customer: order.id_customer, no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal: dp, bukti: '', tipe: 'dp', status: 'confirmed', tanggal: new Date(), created_at: new Date(), updated_at: new Date() }, { transaction: t });
          const pelunasan = Math.round(totalHarga - dp);
          await models.Payment.create({ id_order: order.id_order, id_customer: order.id_customer, no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal: pelunasan, bukti: '', tipe: 'pelunasan', status: 'confirmed', tanggal: new Date(), created_at: new Date(), updated_at: new Date() }, { transaction: t });
          // make piutang marked as lunas
          await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: totalHarga, paid: totalHarga, tanggal_piutang: new Date(), status: 'lunas', keterangan: `Paid via multiple confirmed payments for ${order.no_transaksi}`, id_order: order.id_order, created_at: new Date(), updated_at: new Date() }, { transaction: t });
          created.push({ order: order.no_transaksi, total: totalHarga, payments: 2, piutang: 'lunas' });
        } else {
          const share = sc.paymentShare || 0;
          const nominal = Math.round(totalHarga * share);
          if (nominal > 0) {
            // map tipe: if full -> pelunasan else dp
            const tipe = nominal >= totalHarga ? 'pelunasan' : 'dp';
            await models.Payment.create({ id_order: order.id_order, id_customer: order.id_customer, no_transaksi: order.no_transaksi, no_hp: customer.no_hp, nominal, bukti: '', tipe, status: sc.paymentStatus, tanggal: new Date(), created_at: new Date(), updated_at: new Date() }, { transaction: t });
          }

          const remaining = Math.max(0, totalHarga - nominal);
          const piutangStatus = sc.piutangStatus || (remaining === 0 ? 'lunas' : (sc.makeLate ? 'terlambat' : 'belum_lunas'));
          const paid = sc.piutangStatus === 'lunas' ? totalHarga : nominal;
          const tanggal_piutang = new Date(Date.now() - (sc.makeLate ? 15 : 0) * 24*3600*1000);
          await models.Piutang.create({ id_customer: customer.id_customer, jumlah_piutang: remaining, paid: paid, tanggal_piutang, status: piutangStatus, keterangan: `Piutang for ${order.no_transaksi}`, id_order: order.id_order, created_at: new Date(), updated_at: new Date() }, { transaction: t });

          created.push({ order: order.no_transaksi, total: totalHarga, paymentStatus: sc.paymentStatus, piutangStatus });
        }
      });
    }

    console.log('Created 5 varied transactions:');
    created.forEach((c,idx) => console.log(`${idx+1}. ${c.order} total=${c.total} paymentInfo=${c.payments||c.paymentStatus} piutang=${c.piutang||c.piutangStatus}`));

    process.exit(0);
  } catch (err) {
    console.error('Error seeding varied transactions:', err);
    process.exit(1);
  }
}

main();
