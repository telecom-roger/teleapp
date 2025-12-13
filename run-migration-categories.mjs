import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const sql = fs.readFileSync('./migrations/add_new_categories.sql', 'utf8');
    await pool.query(sql);
    console.log('\n✅ Migration de categorias executada com sucesso!\n');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro na migration:', err.message);
    await pool.end();
    process.exit(1);
  }
})();
