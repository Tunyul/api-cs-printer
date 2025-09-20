
const { Piutang, Customer, Op } = require('../models');

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
        attributes: ['id_piutang', 'id_customer', 'jumlah_piutang', 'tanggal_piutang', 'status', 'keterangan', 'created_at', 'updated_at'],
        include: [{
          model: Customer,
          attributes: ['id_customer', 'nama', 'no_hp']
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
        }],
        where: { id_piutang: piutang.id_piutang }
      });
      
      // Emit piutang.created
      try {
        const io = req.app.get('io');
        if (io && piutangWithCustomer) {
          const payload = { id_piutang: piutangWithCustomer.id_piutang, id_customer: piutangWithCustomer.id_customer, jumlah_piutang: Number(piutangWithCustomer.jumlah_piutang||0), status: piutangWithCustomer.status, timestamp: new Date().toISOString() };
          io.to(`user:${piutangWithCustomer.id_customer}`).emit('piutang.created', payload);
          io.to('role:admin').emit('piutang.created', payload);
          // persist notification
          try {
            const Notification = req.app.get('models').Notification;
            const now = new Date();
            Notification.create({ recipient_type: 'user', recipient_id: String(piutangWithCustomer.id_customer), title: 'Piutang created', body: JSON.stringify(payload), data: payload, read: false, created_at: now, updated_at: now }).catch(()=>{});
            Notification.create({ recipient_type: 'role', recipient_id: 'admin', title: 'Piutang created', body: JSON.stringify(payload), data: payload, read: false, created_at: now, updated_at: now }).catch(()=>{});
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
        }],
        where: { id_piutang: id }
      });
      
      // Emit piutang.updated
      try {
        const io = req.app.get('io');
        if (io && piutangWithCustomer) {
          const payload = { id_piutang: piutangWithCustomer.id_piutang, id_customer: piutangWithCustomer.id_customer, jumlah_piutang: Number(piutangWithCustomer.jumlah_piutang||0), status: piutangWithCustomer.status, timestamp: new Date().toISOString() };
          io.to(`user:${piutangWithCustomer.id_customer}`).emit('piutang.updated', payload);
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
        include: [{
          model: Customer,
          attributes: ['id_customer', 'nama', 'no_hp']
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