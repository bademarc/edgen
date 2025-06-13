async function quickTest() {
  try {
    console.log('🧪 Quick Helper Page Test');
    
    const response = await fetch('http://localhost:3000/helper');
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Helper page is accessible');
      return true;
    } else {
      console.log('❌ Helper page failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

quickTest();
