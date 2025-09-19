const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cukong API',
      version: '1.0.0',
      description: 'API untuk sistem printing management'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Order: {
          type: 'object',
          properties: {
            id_order: { type: 'integer' },
            nomor_transaksi: { type: 'string' },
            tanggal_order: { type: 'string', format: 'date' },
            id_customer: { type: 'integer' },
            nama: { type: 'string' },
            no_hp: { type: 'string' },
            tipe_customer: { type: 'string' },
            status_urgensi: { type: 'string' },
            total_bayar: { type: 'number', format: 'decimal' },
            dp_bayar: { type: 'number', format: 'decimal' },
            status_bayar: { type: 'string' },
            tanggal_jatuh_tempo: { type: 'string', format: 'date' },
            link_invoice: { type: 'string' },
            link_drive: { type: 'string' },
            status_order: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          },
          required: ['nomor_transaksi', 'tanggal_order', 'id_customer', 'nama', 'no_hp', 'tipe_customer', 'total_bayar', 'status_bayar', 'tanggal_jatuh_tempo', 'status_order']
        },
        OrderCreate: {
          type: 'object',
          properties: {
            nomor_transaksi: { type: 'string' },
            tanggal_order: { type: 'string', format: 'date' },
            id_customer: { type: 'integer' },
            nama: { type: 'string' },
            no_hp: { type: 'string' },
            tipe_customer: { type: 'string' },
            status_urgensi: { type: 'string' },
            total_bayar: { type: 'number', format: 'decimal' },
            dp_bayar: { type: 'number', format: 'decimal' },
            status_bayar: { type: 'string' },
            tanggal_jatuh_tempo: { type: 'string', format: 'date' },
            link_invoice: { type: 'string' },
            link_drive: { type: 'string' },
            status_order: { type: 'string' }
          },
          required: ['nomor_transaksi', 'tanggal_order', 'id_customer', 'nama', 'no_hp', 'tipe_customer', 'total_bayar', 'status_bayar', 'tanggal_jatuh_tempo', 'status_order']
        },
        OrderWithProduct: {
          type: 'object',
          properties: {
            id_order: { type: 'integer' },
            nomor_transaksi: { type: 'string' },
            tanggal_order: { type: 'string', format: 'date' },
            id_customer: { type: 'integer' },
            nama: { type: 'string' },
            no_hp: { type: 'string' },
            tipe_customer: { type: 'string' },
            status_urgensi: { type: 'string' },
            total_bayar: { type: 'number', format: 'decimal' },
            dp_bayar: { type: 'number', format: 'decimal' },
            status_bayar: { type: 'string' },
            tanggal_jatuh_tempo: { type: 'string', format: 'date' },
            link_invoice: { type: 'string' },
            link_drive: { type: 'string' },
            status_order: { type: 'string' },
            orderDetails: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderDetail' }
            }
          }
        },
        OrderDetail: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            order_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            unit: { type: 'string' },
            harga_satuan: { type: 'number', format: 'decimal' },
            subtotal_item: { type: 'number', format: 'decimal' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            Product: { $ref: '#/components/schemas/Product' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id_produk: { type: 'integer' },
            kategori: { type: 'string' },
            nama_produk: { type: 'string' },
            bahan: { type: 'string' },
            finishing: { type: 'string' },
            ukuran_standar: { type: 'string' },
            harga_per_m2: { type: 'number', format: 'decimal' },
            harga_per_pcs: { type: 'number', format: 'decimal' },
            waktu_proses: { type: 'string' },
            stock: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id_customer: { type: 'integer' },
            nama: { type: 'string' },
            no_hp: { type: 'string' },
            tipe_customer: { type: 'string' },
            batas_piutang: { type: 'string', format: 'date-time' },
            catatan: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id_payment: { type: 'integer' },
            nominal: { type: 'number', format: 'decimal' },
            tanggal: { type: 'string', format: 'date-time' },
            bukti: { type: 'string' },
            tipe: { type: 'string', enum: ['dp','pelunasan'] },
            no_transaksi: { type: 'string' },
            no_hp: { type: 'string' },
            status: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        PaymentCreate: {
          type: 'object',
          description: 'Request body for creating payments. Supported flows: (1) full create with id_order+nominal+tipe, (2) no_hp+bukti (server links to pending order), (3) no_transaksi+bukti',
          properties: {
            id_order: { type: 'integer' },
            id_customer: { type: 'integer' },
            nominal: { type: 'number', format: 'decimal' },
            tipe: { type: 'string', enum: ['dp','pelunasan'] },
            bukti: { type: 'string' },
            no_hp: { type: 'string' },
            no_transaksi: { type: 'string' },
            status: { type: 'string' },
            tanggal: { type: 'string' }
          }
        },
        Piutang: {
          type: 'object',
          properties: {
            id_piutang: { type: 'integer' },
            id_order: { type: 'integer' },
            total_piutang: { type: 'number', format: 'decimal' },
            tanggal_jatuh_tempo: { type: 'string', format: 'date-time' },
            status_lunas: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi: require('swagger-ui-express'),
  specs
};