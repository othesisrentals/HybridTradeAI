const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log('?? Testing database connection...');
    await client.connect();
    console.log('? Connected successfully!');
    const result = await client.query('SELECT NOW()');
    console.log('? Database time:', result.rows[0].now);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('? Connection failed:', error.message);
    console.log('\n?? Troubleshooting:');
    console.log('1. Wait 2-3 minutes if you just created the Supabase project');
    console.log('2. Check your Supabase project is "Active" in dashboard');
    console.log('3. Try using the "Connection pooling" URL instead');
    console.log('   (Settings ? Database ? Connection pooling ? URI)');
    process.exit(1);
  }
}

testConnection();
