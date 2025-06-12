// Load environment variables
require('dotenv').config();

async function initializeQuests() {
  try {
    console.log('🚀 Initializing default quests...');
    console.log('🔑 Using admin secret:', process.env.ADMIN_SECRET ? 'Found' : 'Not found');

    const response = await fetch('http://localhost:3000/api/quests/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.ADMIN_SECRET
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Default quests initialized successfully');
    } else {
      console.error('❌ Failed to initialize quests:', data.error);
    }
  } catch (error) {
    console.error('❌ Error initializing quests:', error.message);
  }
}

initializeQuests();
