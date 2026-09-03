import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
console.log('Connecting to:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
async function test() {
  try {
    const res = await sql`SELECT 1 as num`;
    console.log('Connection successful:', res);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    process.exit();
  }
}
test();
