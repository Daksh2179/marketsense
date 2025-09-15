require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

async function testConnection() {
  console.log('Testing database connection...');
  console.log('URL (hidden password):', DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW(), current_database()');
    console.log('Database:', result.rows[0].current_database);
    console.log('Current time:', result.rows[0].now);
    
    // Test if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name));
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
  }
}

testConnection();