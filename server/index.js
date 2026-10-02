import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import { getSqlPool } from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, service: 'clinic-api' }));

app.get('/doctors', async (_req, res, next) => {
  try {
    const pool = await getSqlPool();
    const r = await pool.request()
      .query('SELECT id, name, specialty FROM doctors ORDER BY name');
    res.json(r.recordset);
  } catch (e) { next(e); }
});

app.get('/appointments', async (_req, res, next) => {
  try {
    const pool = await getSqlPool();
    const r = await pool.request().query(`
      SELECT a.id, a.patient_name, a.slot, d.name AS doctor_name, d.specialty
      FROM appointments a JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.slot
    `);
    res.json(r.recordset);
  } catch (e) { next(e); }
});

app.post('/appointments', async (req, res, next) => {
  const { doctor_id, patient_name, slot } = req.body || {};
  if (!doctor_id || !patient_name || !slot) {
    return res.status(400).json({ error: 'doctor_id, patient_name, slot are required' });
  }
  try {
    const pool = await getSqlPool();
    const r = await pool.request()
      .input('doctor_id', sql.Int, Number(doctor_id))
      .input('patient_name', sql.NVarChar(200), String(patient_name))
      .input('slot', sql.DateTime2, new Date(slot))
      .query(`
        INSERT INTO appointments (doctor_id, patient_name, slot)
        OUTPUT INSERTED.id, INSERTED.doctor_id, INSERTED.patient_name, INSERTED.slot
        VALUES (@doctor_id, @patient_name, @slot)
      `);
    res.status(201).json(r.recordset[0]);
  } catch (e) { next(e); }
});

// ── คาบ B: ฟีเจอร์ "ยกเลิกนัด" ─────────────────────────────
// DELETE /appointments/:id
//   200 { deleted: id }      — ยกเลิกสำเร็จ
//   400 { error: 'invalid_id' } — id ไม่ใช่จำนวนเต็มบวก (เช็คก่อนแตะ DB)
//   404 { error: 'not_found' }  — ไม่มีนัด id นี้
app.delete('/appointments/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id', hint: 'id must be a positive integer' });
  }
  try {
    const pool = await getSqlPool();
    const r = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM appointments OUTPUT DELETED.id WHERE id = @id');
    if (r.recordset.length === 0) {
      return res.status(404).json({ error: 'not_found', id });
    }
    res.json({ deleted: id });
  } catch (e) { next(e); }
});
// ────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err.code === 'NO_DB_CONFIG') {
    return res.status(503).json({
      error: 'database_not_configured',
      hint: 'Set AZURE_SQL_CONNECTION_STRING environment variable'
    });
  }
  console.error('unhandled', err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

// แยก "การสร้าง app" ออกจาก "การเปิด port"
// — run ตรงๆ (node index.js) ถึงจะ listen
// — test import เข้ามาจะได้ app ไปเปิด port ของตัวเองแทน (ไม่ชนกัน)
const isDirectRun = process.argv[1] && process.argv[1].endsWith('index.js');
if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`clinic-api listening on :${PORT}`);
  });
}

export default app;
