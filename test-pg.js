const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.dlgrirpnkqqtfgcozqbq:11DarineRizaldi26@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require' });
client.connect().then(() => { console.log('Connected'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
