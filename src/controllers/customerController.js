const { Customer } = require('../models');

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      attributes: ['id_customer', 'nama', 'no_hp']
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

// Get all customers or filter by phone
exports.getAllCustomers = async (req, res) => {
  try {
    const { phone } = req.query;
    let customers = [];
    const includeOrders = {
      include: [{
        model: require('../models').Order,
        attributes: ['id_order', 'no_transaksi', 'total_bayar', 'status', 'status_bot', 'dp_bayar', 'status_bayar']
      }]
    };
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    if (req.headers['bot'] === 'true') {
      if (phone) {
        customers = await Customer.findAll({
          where: { no_hp: phone },
          attributes: ['id_customer', 'nama', 'no_hp'],
          ...includeOrders,
          limit,
          offset
        });
      } else {
        customers = await Customer.findAll({
          attributes: ['id_customer', 'nama', 'no_hp'],
          ...includeOrders,
          limit,
          offset
        });
      }
    } else {
      if (phone) {
        customers = await Customer.findAll({
          where: { no_hp: phone },
          ...includeOrders,
          limit,
          offset
        });
      } else {
        customers = await Customer.findAll({
          ...includeOrders,
          limit,
          offset
        });
      }
    }
    if (!customers || customers.length === 0) {
      return res.status(404).json({ error: 'No customers found' });
    }
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.createCustomer = async (req, res) => {
  try {
    const created = await Customer.create(req.body);
    // Ambil data customer yang sudah terbuat agar field tanggal terisi dengan benar
    const customer = await Customer.findByPk(created.id_customer);
    res.status(201).json({
      id_customer: customer.id_customer,
      nama: customer.nama,
      no_hp: customer.no_hp,
      tipe_customer: customer.tipe_customer,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    });
    // Emit realtime event and persist notification via helper (single source)
    try {
  const payload = { id_customer: customer.id_customer, nama: customer.nama, no_hp: customer.no_hp, timestamp: new Date().toISOString() };
  const notify = require('../utils/notify');
  // customer notifications intentionally skipped
  notify(req.app, 'role', 'admin', 'customer.created', payload, 'Customer created');
    } catch (e) {
      console.error('notify customer.created error', e && e.message ? e.message : e);
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating customer",
      error: error.message
    });
  }
};
// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const [updated] = await Customer.update(req.body, {
      where: { id_customer: req.params.id }
    });
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }
    const updatedCustomer = await Customer.findByPk(req.params.id);
    res.status(200).json({ 
      success: true,
      message: 'Customer updated successfully',
      updatedCustomer 
    });
    // Emit customer.updated to user and admins, persist notification via helper
    try {
      const payload = { id_customer: updatedCustomer.id_customer, nama: updatedCustomer.nama, no_hp: updatedCustomer.no_hp, timestamp: new Date().toISOString() };
  const notify = require('../utils/notify');
  // notify customer skipped intentionally
  notify(req.app, 'role', 'admin', 'customer.updated', payload, 'Customer updated');
    } catch (e) {
      console.error('notify customer.updated error', e && e.message ? e.message : e);
    }
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Error updating customer",
      error: error.message 
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deleted = await Customer.destroy({
      where: { id_customer: req.params.id }
    });
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }
    res.status(200).json({ 
      success: true,
      message: 'Customer deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting customer",
      error: error.message 
    });
  }
};
