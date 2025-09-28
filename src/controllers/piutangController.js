
const { Piutang, Customer, Order, Op } = require('../models');

class PiutangController {
  // Get all piutangs
  static async getAllPiutangs(req, res) {
    try {
      const { search = '', status = '' } = req.query;

      let whereClause = {};

      if (search) {
        whereClause = {
          [Op.or]: [
            { '$customer.nama$': { [Op.like]: `%${search}%` } },
            { '$customer.no_hp$': { [Op.like]: `%${search}%` } }
          ]
        };
      }

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      // Always return all piutangs (no pagination)
      const piutangs = await Piutang.findAll({
        attributes: ['id_piutang', 'id_customer', 'jumlah_piutang', 'paid', 'tanggal_piutang', 'status', 'keterangan', 'id_order', 'created_at', 'updated_at'],
        include: [{
          model: Customer,
          attributes: ['id_customer', 'nama', 'no_hp']
        }, {
          model: Order,
          attributes: ['id_order', 'no_transaksi', 'tanggal_order', 'total_bayar', 'status']
        }],
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: piutangs,
        meta: { total: piutangs.length }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching piutangs',
        error: error.message
      });
    }
  }

  // Get piutang by ID
  static async getPiutangById(req, res) {
    try {
      const { id } = req.params;
      const piutang = await Piutang.findOne({
        include: [{
          model: Customer,
          attributes: ['id_customer', 'nama', 'no_hp']
        }, {
          model: Order,
          attributes: ['id_order', 'no_transaksi', 'tanggal_order', 'total_bayar', 'status']
        }],
        where: { id_piutang: id }
      });
      
      if (!piutang) {
        return res.status(404).json({ error: 'Piutang not found' });
      }
      res.status(200).json({
        success: true,
        data: piutang
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching piutang',
        error: error.message
      });
    }
  }

  // Create new piutang
  static async createPiutang(req, res) {
    try {
      const piutangData = req.body;
      
      // Validasi data
      if (!piutangData.id_customer || !piutangData.jumlah_piutang || !piutangData.tanggal_piutang) {
        return res.status(400).json({
          success: false,
          message: 'id_customer, jumlah_piutang, and tanggal_piutang are required'
        });
      }

      const piutang = await Piutang.create(piutangData);
      
      // Ambil data lengkap dengan customer
      const piutangWithCustomer = await Piutang.findOne({
        include: [{
          model: Customer,
          attributes: ['id_customer', 'nama', 'no_hp']
        }, {
          model: Order,
          attributes: ['id_order', 'no_transaksi', 'tanggal_order', 'total_bayar', 'status']
        }],
        where: { id_piutang: piutang.id_piutang }
      });
      
      // Emit piutang.created
      try {
        const io = req.app.get('io');
        if (io && piutangWithCustomer) {
          const payload = { id_piutang: piutangWithCustomer.id_piutang, id_customer: piutangWithCustomer.id_customer, jumlah_piutang: Number(piutangWithCustomer.jumlah_piutang||0), status: piutangWithCustomer.status, timestamp: new Date().toISOString() };
          // emit to admin only
          io.to('role:admin').emit('piutang.created', payload);
          // persist notification
          try {
            // use centralized notify helper to emit + persist
            const notify = require('../utils/notify');
            notify(req.app, 'role', 'admin', 'piutang.created', payload, 'Piutang created').catch(()=>{});
          } catch(e){}
        }
      } catch (e) {
        console.error('emit piutang.created error', e && e.message ? e.message : e);
      }

      res.status(201).json({
        success: true,
        message: 'Piutang created successfully',
        data: piutangWithCustomer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating piutang',
        error: error.message
      });
    }
  }

  // Update piutang
  static async updatePiutang(req, res) {
    try {
      const { id } = req.params;
      const piutangData = req.body;
      
      const piutang = await Piutang.findByPk(id);
      
      if (!piutang) {
        return res.status(404).json({ error: 'Piutang not found' });
      }

      await piutang.update(piutangData);
      
      // Ambil data lengkap dengan customer
      const piutangWithCustomer = await Piutang.findOne({
        include: [{
          model: Customer,
          attributes: ['id_customer', 'nama', 'no_hp']
        }, {
          model: Order,
          attributes: ['id_order', 'no_transaksi', 'tanggal_order', 'total_bayar', 'status']
        }],
        where: { id_piutang: id }
      });
      
      // Emit piutang.updated
      try {
        const io = req.app.get('io');
        if (io && piutangWithCustomer) {
          const payload = { id_piutang: piutangWithCustomer.id_piutang, id_customer: piutangWithCustomer.id_customer, jumlah_piutang: Number(piutangWithCustomer.jumlah_piutang||0), status: piutangWithCustomer.status, timestamp: new Date().toISOString() };
          // emit to admin only
          io.to('role:admin').emit('piutang.updated', payload);
        }
      } catch (e) {
        console.error('emit piutang.updated error', e && e.message ? e.message : e);
      }

      res.json({
        success: true,
        message: 'Piutang updated successfully',
        data: piutangWithCustomer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating piutang',
        error: error.message
      });
    }
  }

  // Delete piutang
  static async deletePiutang(req, res) {
    try {
      const { id } = req.params;
      const piutang = await Piutang.findByPk(id);
      
      if (!piutang) {
        return res.status(404).json({ error: 'Piutang not found' });
      }

      await piutang.destroy();
      
      res.json({
        success: true,
        message: 'Piutang deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting piutang',
        error: error.message
      });
    }
  }

  // Get piutangs by customer ID
  static async getPiutangsByCustomerId(req, res) {
    try {
      const { id } = req.params;
      
      const piutangs = await Piutang.findAll({
          attributes: ['id_piutang', 'id_customer', 'jumlah_piutang', 'paid', 'tanggal_piutang', 'status', 'keterangan', 'id_order', 'created_at', 'updated_at'],
          include: [{
            model: Customer,
            attributes: ['id_customer', 'nama', 'no_hp']
          }, {
            model: Order,
            attributes: ['id_order', 'no_transaksi', 'tanggal_order', 'total_bayar', 'status']
          }],
          where: { id_customer: id },
        order: [['created_at', 'DESC']]
      });

      if (!piutangs || piutangs.length === 0) {
        return res.status(404).json({ error: 'No piutang found for this customer' });
      }
      res.status(200).json({
        success: true,
        data: piutangs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching piutangs for customer',
        error: error.message
      });
    }
  }

  // Get overdue piutangs
  static async getOverduePiutangs(req, res) {
    try {
      const now = new Date();
      
      const overduePiutangs = await Piutang.findAll({
        include: [{
          model: Customer,
          attributes: ['id_customer', 'nama', 'no_hp']
        }, {
          model: Order,
          attributes: ['id_order', 'no_transaksi', 'tanggal_order', 'total_bayar', 'status']
        }],
        where: {
          tanggal_jatuh_tempo: { [Op.lt]: now },
          status: { [Op.ne]: 'lunas' }
        },
        order: [['tanggal_jatuh_tempo', 'ASC']]
      });

      if (!overduePiutangs || overduePiutangs.length === 0) {
        return res.status(404).json({ error: 'No overdue piutang found' });
      }
      res.status(200).json({
        success: true,
        data: overduePiutangs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching overdue piutangs',
        error: error.message
      });
    }
  }
}

module.exports = PiutangController;