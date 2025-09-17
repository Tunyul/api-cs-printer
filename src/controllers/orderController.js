// Update status_bot order berdasarkan no_transaksi dan header bot=true
exports.updateStatusBotByNoTransaksi = async (req, res) => {
  try {
    if (req.headers['bot'] !== 'true') {
      return res.status(400).json({ error: 'Header bot=true wajib' });
    }
    const { no_transaksi } = req.params;
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
    await order.update({ status_bot: 'selesai' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Hitung total piutang customer (total yang harus dibayar dari semua order belum lunas)
exports.getCustomerTotalPiutang = async (req, res) => {
  try {
    const customerId = req.params.id;
    // Ambil semua order belum lunas
    const orders = await models.Order.findAll({
      where: {
        id_customer: customerId,
        status_bayar: 'belum_lunas'
      }
    });
    // Hitung total piutang
    const totalPiutang = orders.reduce((sum, order) => {
      const sisa = Number(order.total_bayar) - Number(order.dp_bayar || 0);
      return sum + sisa;
    }, 0);
    res.json({
      success: true,
      customer_id: customerId,
      total_piutang: totalPiutang,
      orders: orders.map(order => ({
        id_order: order.id_order,
        total_bayar: order.total_bayar,
        dp_bayar: order.dp_bayar,
        sisa_bayar: Number(order.total_bayar) - Number(order.dp_bayar || 0),
        status_bayar: order.status_bayar
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating total piutang',
      error: error.message
    });
  }
};
'use strict';

const models = require('../models');

// Fungsi untuk generate nomor transaksi
function generateTransactionNumber(customerName) {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  // Generate 4 digit random number
  const random = Math.floor(Math.random() * 9000) + 1000;
  
  // Ambil nama depan dari customer (sebelum spasi), uppercase
  let namePart = 'XXX';
  if (customerName) {
    namePart = customerName.split(' ')[0].toUpperCase();
  }
  
  return `TRX-${day}${month}${year}-${random}-${namePart}`;
}

// Fungsi untuk generate default links
function generateDefaultLinks(transactionNumber) {
  const invoiceLink = `https://drive.google.com/file/d/${transactionNumber}/view`;
  const driveLink = `https://drive.google.com/drive/folders/${transactionNumber}`;
  
  return {
    link_invoice: invoiceLink,
    link_drive: driveLink
  };
}

// Fungsi untuk menghitung total bayar dari order details
async function calculateTotalBayar(orderId) {
  try {
    const orderDetails = await models.OrderDetail.findAll({
      where: { order_id: orderId }
    });
    
    let totalBayar = 0;
    orderDetails.forEach(detail => {
      if (detail.subtotal_item) {
        totalBayar += parseFloat(detail.subtotal_item);
      }
    });
    
    return totalBayar;
  } catch (error) {
    throw error;
  }
}

// Fungsi untuk menghitung total bayar global dari semua order dalam satu transaksi
async function calculateTransactionTotal(transactionNumber) {
  try {
    // Dapatkan semua order dengan nomor transaksi yang sama
    const orders = await models.Order.findAll({
      where: { nomor_transaksi: transactionNumber }
    });
    
    let totalBayar = 0;
    for (const order of orders) {
      if (order.total_bayar) {
        totalBayar += parseFloat(order.total_bayar);
      }
    }
    
    return totalBayar;
  } catch (error) {
    throw error;
  }
}

// Fungsi untuk menghitung total bayar semua order customer
async function calculateCustomerTotal(customerId) {
  try {
    // Dapatkan semua order dari customer
    const orders = await models.Order.findAll({
      where: { id_customer: customerId }
    });
    
    let totalBayar = 0;
    for (const order of orders) {
      if (order.total_bayar) {
        totalBayar += parseFloat(order.total_bayar);
      }
    }
    
    return totalBayar;
  } catch (error) {
    throw error;
  }
}

// Fungsi untuk membuat piutang otomatis
async function createPiutangAutomatically(orderId, customerId, totalBayar, transaction) {
  try {
    // Buat piutang dengan field yang sesuai dengan tabel piutang
    const now = new Date();
    const piutangData = {
      id_order: orderId,
      id_customer: customerId,
      jumlah_piutang: totalBayar,
      tanggal_piutang: now,
      status: 'belum_lunas',
      created_at: now,
      updated_at: now
    };
    const piutang = await models.Piutang.create(piutangData, { transaction });
    return piutang;
  } catch (error) {
    throw error;
  }
}

// Fungsi untuk mendapatkan semua order
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await models.Order.findAll({
      include: [{
        model: models.OrderDetail,
        include: [models.Product]
      }]
    });
  res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk mendapatkan order berdasarkan ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await models.Order.findByPk(req.params.id, {
      include: [{
        model: models.OrderDetail,
        include: [models.Product]
      }]
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk membuat order baru
exports.createOrder = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const { id_customer, no_hp, order_details } = req.body;
    let customer;
    // Validasi customer
    if (id_customer) {
      customer = await models.Customer.findByPk(id_customer);
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
    } else if (no_hp) {
      customer = await models.Customer.findOne({ where: { no_hp } });
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
    } else {
      return res.status(400).json({ error: 'ID customer atau No HP wajib diisi' });
    }

    // Validasi order_details
    if (!order_details || !Array.isArray(order_details) || order_details.length === 0) {
      return res.status(400).json({ error: 'Order details wajib diisi' });
    }

    // Cek order dengan status_bot pending untuk customer
    let order = await models.Order.findOne({
      where: {
        id_customer: customer.id_customer,
        status_bot: 'pending'
      },
      transaction
    });

    let nomor_transaksi;
    let defaultLinks;
    let isNewOrder = false;
    if (!order) {
      // Buat order baru
      nomor_transaksi = generateTransactionNumber(customer.nama);
      defaultLinks = generateDefaultLinks(nomor_transaksi);

      // Hitung total bayar dari order_details
      let total_bayar = 0;
      const orderDetailData = [];
      for (const item of order_details) {
        const product = await models.Product.findByPk(item.id_product);
        if (!product) return res.status(404).json({ error: `Product ${item.id_product} not found` });
        const harga = Number(product.harga_per_pcs || 0);
        const quantity = Number(item.qty || 1);
        const subtotal_item = harga * quantity;
        total_bayar += subtotal_item;
        orderDetailData.push({
          quantity,
          harga_satuan: harga,
          subtotal_item
        });
      }

      // Siapkan data order
      const orderData = {
        id_customer: customer.id_customer,
        no_transaksi: nomor_transaksi,
        tanggal_order: new Date(),
        status_urgensi: 'normal',
        total_bayar,
        dp_bayar: 0,
        status_bayar: 'belum_lunas',
        tanggal_jatuh_tempo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        link_invoice: defaultLinks.link_invoice,
        link_drive: defaultLinks.link_drive,
        status_order: 'pending',
        total_harga: total_bayar,
        status: 'pending',
        catatan: '',
        status_bot: 'pending'
      };

      order = await models.Order.create(orderData, { transaction });
      isNewOrder = true;

      // Buat order details
      for (const detail of orderDetailData) {
        await models.OrderDetail.create({ ...detail, order_id: order.id_order }, { transaction });
      }
    } else {
      // Tambahkan produk ke order detail yang sudah ada
      let total_bayar = Number(order.total_bayar);
      for (const item of order_details) {
        const product = await models.Product.findByPk(item.id_product);
        if (!product) return res.status(404).json({ error: `Product ${item.id_product} not found` });
        const harga = Number(product.harga_per_pcs || 0);
        const quantity = Number(item.qty || 1);
        const subtotal_item = harga * quantity;
        total_bayar += subtotal_item;
        await models.OrderDetail.create({
          quantity,
          harga_satuan: harga,
          subtotal_item,
          order_id: order.id_order
        }, { transaction });
      }
      // Update total_bayar di order
      await models.Order.update({ total_bayar, total_harga: total_bayar }, {
        where: { id_order: order.id_order },
        transaction
      });
    }

    // Buat piutang otomatis (hanya jika order baru)
    if (isNewOrder) {
      await createPiutangAutomatically(order.id_order, customer.id_customer, order.total_bayar, transaction);
    }

    // Ambil order dengan detail
    const orderWithDetails = await models.Order.findByPk(order.id_order, {
      include: [{
        model: models.OrderDetail,
        include: [models.Product]
      }],
      transaction
    });

    await transaction.commit();
    // Jika header bot = true, respon custom
    if (req.headers['bot'] === 'true') {
      // Ambil nama produk untuk setiap order detail dari request
      const orderDetailsWithProductName = await Promise.all(order_details.map(async (item) => {
        const product = await models.Product.findByPk(item.id_product);
        const harga = Number(product ? product.harga_per_pcs : 0);
        const quantity = Number(item.qty || 1);
        const subtotal_item = harga * quantity;
        return {
          nama_produk: product ? product.nama_produk : null,
          quantity,
          harga_satuan: harga,
          subtotal_item
        };
      }));
      return res.status(201).json({
        id_order: order.id_order,
        id_customer: order.id_customer,
        no_transaksi: order.no_transaksi,
        total_bayar: order.total_bayar,
        order_details: orderDetailsWithProductName
      });
    }
    // Default respon
    res.status(201).json(orderWithDetails);
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk mengupdate order
exports.updateOrder = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const { orderDetails, ...orderData } = req.body;
    
    const [updated] = await models.Order.update(orderData, {
      where: { id_order: req.params.id },
      transaction
    });
    
    if (updated) {
      // Hapus detail lama jika ada orderDetails baru
      if (orderDetails && Array.isArray(orderDetails)) {
        await models.OrderDetail.destroy({
          where: { order_id: req.params.id },
          transaction
        });
        
        // Buat detail baru
        const orderDetailPromises = orderDetails.map(detail => {
          return models.OrderDetail.create({
            ...detail,
            order_id: req.params.id
          }, { transaction });
        });
        
        await Promise.all(orderDetailPromises);
      }
      
      // Update total bayar setelah detail diubah
      const totalBayar = await calculateTotalBayar(req.params.id);
      await models.Order.update(
        { total_bayar: totalBayar },
        { where: { id_order: req.params.id }, transaction }
      );
      
      const updatedOrder = await models.Order.findByPk(req.params.id, {
        include: [{
          model: models.OrderDetail,
          include: [models.Product]
        }],
        transaction
      });
      
      await transaction.commit();
  res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk menghapus order
exports.deleteOrder = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    // Hapus order details dulu
    await models.OrderDetail.destroy({
      where: { order_id: req.params.id },
      transaction
    });
    
    // Hapus piutang terkait
    await models.Piutang.destroy({
      where: { id_order: req.params.id },
      transaction
    });
    
    // Hapus order
    const deleted = await models.Order.destroy({
      where: { id_order: req.params.id },
      transaction
    });
    
    if (deleted) {
      await transaction.commit();
  res.status(200).json({ message: 'Order deleted successfully' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk mendapatkan order details berdasarkan order ID
exports.getOrderDetailsByOrderId = async (req, res) => {
  try {
    const orderDetails = await models.OrderDetail.findAll({
      where: { order_id: req.params.id },
      include: [models.Product]
    });
    if (!orderDetails || orderDetails.length === 0) {
      return res.status(404).json({ error: 'Order details not found' });
    }
    res.status(200).json(orderDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk mendapatkan order berdasarkan customer ID
exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const no_hp = req.query.no_hp;
    if (!no_hp) {
      return res.status(400).json({ error: 'no_hp parameter is required' });
    }
    const customer = await models.Customer.findOne({ where: { no_hp } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const orders = await models.Order.findAll({
      where: { id_customer: customer.id_customer },
      include: [{
        model: models.OrderDetail,
        include: [models.Product]
      }],
  order: [['no_transaksi', 'ASC'], ['id_order', 'ASC']]
    });
    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'Orders not found for this customer' });
    }
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk mendapatkan order berdasarkan nomor telepon customer
exports.getOrdersByCustomerPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ error: 'Phone parameter is required' });
    }
    
    // Cari customer berdasarkan nomor telepon
    const customer = await models.Customer.findOne({
      where: { no_hp: phone }
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Dapatkan semua order untuk customer tersebut
    const orders = await models.Order.findAll({
      where: { id_customer: customer.id_customer },
      include: [{
        model: models.OrderDetail,
        include: [models.Product]
      }],
      order: [['nomor_transaksi', 'ASC'], ['id_order', 'ASC']]
    });
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'Orders not found for this customer phone' });
    }
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk menghitung total bayar semua order customer
exports.getCustomerTotalBayar = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    // Hitung total bayar semua order customer
    const totalBayar = await calculateCustomerTotal(customerId);
    
    res.status(200).json({
      customer_id: customerId,
      total_bayar: totalBayar,
      orders_count: await models.Order.count({ where: { id_customer: customerId } })
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk menghitung total bayar semua order customer berdasarkan no_hp
exports.getCustomerTotalByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone parameter is required' });
    }
    
    // Cari customer berdasarkan nomor telepon
    const customer = await models.Customer.findOne({
      where: { no_hp: phone }
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Hitung total bayar semua order customer
    const totalBayar = await calculateCustomerTotal(customer.id_customer);
    
    res.status(200).json({
      customer_id: customer.id_customer,
      customer_name: customer.nama,
      customer_phone: customer.no_hp,
      total_bayar: totalBayar,
      orders_count: await models.Order.count({ where: { id_customer: customer.id_customer } })
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk mengupdate total bayar
exports.updateOrderTotalBayar = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Hitung ulang total bayar dari semua order details
    const totalBayar = await calculateTotalBayar(orderId);
    
    // Update total bayar di tabel order
    await models.Order.update(
      { total_bayar: totalBayar },
      { where: { id_order: orderId } }
    );
    
    // Ambil order yang sudah diupdate
    const updatedOrder = await models.Order.findByPk(orderId, {
      include: [{
        model: models.OrderDetail,
        include: [models.Product]
      }]
    });
    
  res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk menghitung total bayar global dari semua order dalam satu transaksi
exports.getTransactionTotal = async (req, res) => {
  try {
    const { transactionNumber } = req.params;
    
    if (!transactionNumber) {
      return res.status(400).json({ error: 'Transaction number is required' });
    }
    
    // Dapatkan semua order dengan nomor transaksi yang sama
    const orders = await models.Order.findAll({
      where: { nomor_transaksi: transactionNumber },
      include: [{
        model: models.OrderDetail,
        include: [models.Product]
      }]
    });
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Hitung total bayar dari semua order detail
    let totalBayarFromDetails = 0;
    for (const order of orders) {
      const orderDetails = await models.OrderDetail.findAll({
        where: { order_id: order.id_order }
      });
      
      orderDetails.forEach(detail => {
        if (detail.subtotal_item) {
          totalBayarFromDetails += parseFloat(detail.subtotal_item);
        }
      });
    }
    
    res.status(200).json({
      transaction_number: transactionNumber,
      total_bayar: totalBayarFromDetails,
      order_count: orders.length,
      orders: orders.map(order => ({
        id_order: order.id_order,
        total_bayar: order.total_bayar,
        order_details: order.OrderDetails.map(detail => ({
          product_name: detail.Product?.nama_produk,
          quantity: detail.quantity,
          unit: detail.unit,
          harga_satuan: detail.harga_satuan,
          subtotal_item: detail.subtotal_item
        }))
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateTransactionNumber = generateTransactionNumber;

// Fungsi untuk mengupdate order berdasarkan no_transaksi
exports.updateOrderByNoTransaksi = async (req, res) => {
  try {
    const { no_transaksi } = req.params;
    const updateData = req.body;
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.update(updateData);
    const updatedOrder = await models.Order.findOne({ where: { no_transaksi } });
    res.status(200).json({ success: true, message: 'Order updated', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk menambah order detail ke order berdasarkan no_transaksi
exports.addOrderDetailByNoTransaksi = async (req, res) => {
  try {
    const { no_transaksi } = req.params;
    const { order_details } = req.body;
    const models = require('../models');
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!order_details || !Array.isArray(order_details) || order_details.length === 0) {
      return res.status(400).json({ error: 'order_details array required' });
    }
    // Tambahkan order detail satu per satu
    for (const item of order_details) {
      if (!item.id_product || !item.qty) {
        return res.status(400).json({ error: 'id_product and qty required for each order detail' });
      }
      await models.OrderDetail.create({
        order_id: order.id_order,
        id_product: item.id_product,
        quantity: item.qty
      });
    }
    // Ambil order dengan detail terbaru
    const updatedOrder = await models.Order.findByPk(order.id_order, {
      include: [{ model: models.OrderDetail, include: [models.Product] }]
    });
    res.status(200).json({ success: true, message: 'Order details added', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi untuk update order detail (replace all) berdasarkan no_transaksi
exports.updateOrderDetailsByNoTransaksi = async (req, res) => {
  try {
    if (req.headers['bot'] !== 'true') {
      return res.status(400).json({ error: 'Header bot=true required' });
    }
    const { no_transaksi } = req.params;
    const { order_details } = req.body;
    const models = require('../models');
    const order = await models.Order.findOne({ where: { no_transaksi } });
    if (!order) {
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }
    if (!order_details || !Array.isArray(order_details) || order_details.length === 0) {
      return res.status(400).json({ error: 'order_details array wajib diisi' });
    }
    // Validasi semua order_details
    for (const item of order_details) {
      if (!item.id_produk || typeof item.qty !== 'number' || item.qty <= 0) {
        return res.status(400).json({ error: 'id_produk harus valid dan qty > 0 untuk setiap order detail' });
      }
      const product = await models.Product.findByPk(item.id_produk);
      if (!product) {
        return res.status(404).json({ error: `Produk ${item.id_produk} tidak ditemukan` });
      }
    }

    // Audit log perubahan order_details
    const oldDetails = await models.OrderDetail.findAll({ where: { id_order: order.id_order } });
    const auditLog = {
      waktu: new Date(),
      no_transaksi,
      id_order: order.id_order,
      order_details_lama: oldDetails.map(d => ({ id_produk: d.id_produk, qty: d.quantity })),
      order_details_baru: order_details
    };
    const fs = require('fs');
    fs.appendFileSync('order_audit.log', JSON.stringify(auditLog) + '\n');

    // Jika order_details masih kosong, buat baru
    if (!oldDetails || oldDetails.length === 0) {
      let total_bayar = 0;
      for (const item of order_details) {
        const product = await models.Product.findByPk(item.id_produk);
        const harga = Number(product.harga_per_pcs || 0);
        const quantity = Number(item.qty || 1);
        const subtotal_item = harga * quantity;
        total_bayar += subtotal_item;
        await models.OrderDetail.create({
          id_order: order.id_order,
          id_produk: item.id_produk,
          quantity,
          harga_satuan: harga,
          subtotal_item
        });
      }
      await order.update({ total_bayar, total_harga: total_bayar });
      const updatedOrder = await models.Order.findByPk(order.id_order, {
        include: [{ model: models.OrderDetail, include: [models.Product] }]
      });
      return res.status(200).json({ order: updatedOrder });
    }

    // Jika sudah ada order_details, replace dengan data baru
    await models.OrderDetail.destroy({ where: { id_order: order.id_order } });
    let total_bayar = 0;
    for (const item of order_details) {
      const product = await models.Product.findByPk(item.id_produk);
      const harga = Number(product.harga_per_pcs || 0);
      const quantity = Number(item.qty || 1);
      const subtotal_item = harga * quantity;
      total_bayar += subtotal_item;
      await models.OrderDetail.create({
        id_order: order.id_order,
        id_produk: item.id_produk,
        quantity,
        harga_satuan: harga,
        subtotal_item
      });
    }
    await order.update({ total_bayar, total_harga: total_bayar });
    const updatedOrder = await models.Order.findByPk(order.id_order, {
      include: [{ model: models.OrderDetail, include: [models.Product] }]
    });
    res.status(200).json({ order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};