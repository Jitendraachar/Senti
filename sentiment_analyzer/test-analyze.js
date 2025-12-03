// Quick test script to check if analyze endpoint works
const axios = require('axios');

async function testAnalyze() {
    try {
        // You'll need to replace 'YOUR_TOKEN' with an actual token
        // Get it from browser localStorage or login first
        const response = await axios.post('http://localhost:5000/api/analyze', {
            text: 'I am feeling great today!'
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE'
            },
            timeout: 120000
        });

        console.log('✅ Success!', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

testAnalyze();
