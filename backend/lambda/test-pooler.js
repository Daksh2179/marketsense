require('dotenv').config();
const { Client } = require('pg');

// Test both direct and pooler connections
const connections = {
  direct: "postgresql://postgres:4DiGYpJZir1Uv8Ga@db.vbpryxiikmvryxioeajd.supabase.co:5432/postgres",
  session: "postgresql://postgres.vbpryxiikmvryxioeajd:4DiGYpJZir1Uv8Ga@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  transaction: "postgresql://postgres.vbpryxiikmvryxioeajd:4DiGYpJZir1Uv8Ga@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
};

async function testConnection(name, connectionString) {
  console.log(`\nTesting ${name} connection...`);
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log(`✅ ${name} connected successfully!`);
    
    const result = await client.query('SELECT NOW(), current_database()');
    console.log(`Database: ${result.rows[0].current_database}`);
    console.log(`Time: ${result.rows[0].now}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.error(`❌ ${name} connection failed:`, error.message);
    return false;
  }
}

async function testAll() {
  console.log('Testing all connection methods...');
  
  const results = {
    direct: await testConnection('Direct', connections.direct),
    session: await testConnection('Session Pooler', connections.session),
    transaction: await testConnection('Transaction Pooler', connections.transaction)
  };
  
  console.log('\n📊 Summary:');
  console.log('Direct:', results.direct ? '✅' : '❌');
  console.log('Session Pooler:', results.session ? '✅' : '❌');
  console.log('Transaction Pooler:', results.transaction ? '✅' : '❌');
  
  console.log('\n💡 Recommendation for Lambda: Use Transaction Pooler (port 6543)');
}

testAll();