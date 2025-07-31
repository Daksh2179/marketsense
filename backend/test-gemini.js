// Update test-gemini.js to test multiple keys:
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testMultipleKeys() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2, 
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean);
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
  
  for (let i = 0; i < keys.length; i++) {
    console.log(`\n🔑 Testing API Key ${i + 1}...`);
    
    for (const modelName of models) {
      try {
        console.log(`  Trying ${modelName}...`);
        const genAI = new GoogleGenerativeAI(keys[i]);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent('Say hello');
        console.log(`  ✅ SUCCESS with Key ${i + 1} + ${modelName}:`, result.response.text());
        return; // Exit on first success
      } catch (error) {
        console.log(`  ❌ Key ${i + 1} + ${modelName} failed:`, error.message.substring(0, 100));
      }
    }
  }
  
  console.log('\n❌ All keys and models failed');
}

testMultipleKeys();