const models = require('../src/models');
(async () => {
  try {
    await models.sequelize.authenticate();
    const customer = await models.Customer.findOne({ where: { no_hp: '1111' } });
    if (!customer) {
      console.log('Customer not found');
      process.exit(0);
    }
    const idc = customer.id_customer;
    console.log('Customer', idc);
    const orders = await models.Order.findAll({ where: { id_customer: idc } });
    let totalOutstanding = 0;
    for (const o of orders) {
      const paid = (await models.Payment.sum('nominal', { where: { no_transaksi: o.no_transaksi } })) || 0;
      const rem = Number(o.total_bayar || 0) - Number(paid || 0);
      if (rem > 0) totalOutstanding += rem;
    }
    const totalPaidAll = (await models.Payment.sum('nominal', { where: { no_hp: customer.no_hp } })) || 0;
    console.log('Computed totalOutstanding=', totalOutstanding, ' totalPaidAll=', totalPaidAll);
    const piutangs = await models.Piutang.findAll({ where: { id_customer: idc } });
    console.log('Piutangs before:', piutangs.map(p => p.toJSON()));
    if (piutangs.length === 0) {
      await models.Piutang.create({
        id_customer: idc,
        jumlah_piutang: totalOutstanding,
        paid: totalPaidAll,
        tanggal_piutang: new Date(),
        status: totalOutstanding <= totalPaidAll ? 'lunas' : 'belum_lunas',
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('Created new piutang');
    } else if (piutangs.length === 1) {
      const p = piutangs[0];
      await p.update({
        jumlah_piutang: totalOutstanding,
        paid: totalPaidAll,
        status: totalOutstanding <= totalPaidAll ? 'lunas' : 'belum_lunas',
        updated_at: new Date()
      });
      console.log('Updated existing piutang');
    } else {
      await models.Piutang.destroy({ where: { id_customer: idc } });
      await models.Piutang.create({
        id_customer: idc,
        jumlah_piutang: totalOutstanding,
        paid: totalPaidAll,
        tanggal_piutang: new Date(),
        status: totalOutstanding <= totalPaidAll ? 'lunas' : 'belum_lunas',
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('Rebuilt piutang (deleted multiple, created one)');
    }
    const piutangsAfter = await models.Piutang.findAll({ where: { id_customer: idc } });
    console.log('Piutangs after:', piutangsAfter.map(p => p.toJSON()));
    process.exit(0);
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
})();
