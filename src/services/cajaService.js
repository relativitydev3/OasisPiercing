const MovimientoCaja = require('../models/MovimientoCaja');
const { ESTADO_VENTA } = require('./ventaService');
const { requireDb } = require('../utils/db');
const { AppError } = require('../utils/errors');
const { stripHtml } = require('../utils/sanitize');
const {
  parseMesQuery,
  mesToRange,
  formatMesLabel,
} = require('../validations/caja.validation');

function toNumber(value) {
  return Number(value) || 0;
}

class CajaService {
  static async getBalance(mesStr) {
    const sql = requireDb();
    const mes = parseMesQuery(mesStr);
    const filtered = mes !== null;

    let ventasRow;
    let sums;

    if (filtered) {
      const { desde, hastaExclusive } = mesToRange(mes);
      [ventasRow, sums] = await Promise.all([
        sql`
          SELECT COALESCE(SUM(total), 0) AS total, COUNT(*)::int AS count
          FROM pedidos
          WHERE estado = ${ESTADO_VENTA}
            AND DATE(updated_at) >= ${desde}::date
            AND DATE(updated_at) < ${hastaExclusive}::date
        `,
        MovimientoCaja.sumByTipoInRange(desde, hastaExclusive),
      ]);
    } else {
      [ventasRow, sums] = await Promise.all([
        sql`
          SELECT COALESCE(SUM(total), 0) AS total, COUNT(*)::int AS count
          FROM pedidos
          WHERE estado = ${ESTADO_VENTA}
        `,
        MovimientoCaja.sumByTipoAll(),
      ]);
    }

    const ingresosVentas = toNumber(ventasRow[0]?.total);
    const ventasCount = toNumber(ventasRow[0]?.count);
    const totalGastos = sums.gasto;
    const totalIngresosExtra = sums.ingreso;
    const balanceNeto = ingresosVentas + totalIngresosExtra - totalGastos;

    return {
      mes,
      filtered,
      mesLabel: filtered ? formatMesLabel(mes) : 'Total histórico',
      ingresosVentas,
      ventasCount,
      totalGastos,
      totalIngresosExtra,
      balanceNeto,
    };
  }

  static async getResumen(mesStr) {
    const balance = await this.getBalance(mesStr);
    const movimientos = balance.filtered
      ? await MovimientoCaja.findByMonth(
          mesToRange(balance.mes).desde,
          mesToRange(balance.mes).hastaExclusive,
        )
      : await MovimientoCaja.findAll();

    return {
      ...balance,
      movimientos,
    };
  }

  static async findById(id) {
    requireDb();
    const mov = await MovimientoCaja.findById(id);
    if (!mov) throw new AppError('Movimiento no encontrado.', 404);
    return mov;
  }

  static sanitizeData(data) {
    return {
      tipo: data.tipo,
      concepto: stripHtml(data.concepto),
      monto: data.monto,
      fecha: data.fecha,
      notas: data.notas ? stripHtml(data.notas) : null,
    };
  }

  static async create(data, usuarioId) {
    requireDb();
    const clean = this.sanitizeData(data);
    return MovimientoCaja.create({ ...clean, usuario_id: usuarioId ?? null });
  }

  static async update(id, data) {
    requireDb();
    await this.findById(id);
    const clean = this.sanitizeData(data);
    return MovimientoCaja.update(id, clean);
  }

  static async delete(id) {
    requireDb();
    await this.findById(id);
    await MovimientoCaja.delete(id);
    return true;
  }
}

module.exports = CajaService;
