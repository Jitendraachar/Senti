// Test script to verify journal creation API

const API_URL = 'http://localhost:5000/api';

async function testJournalCreation() {
    try {
        console.log('1. Logging in...');
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });

        if (!loginResponse.ok) {
            console.log('Login failed, trying to register...');
            const registerResponse = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                })
            });
            const registerData = await registerResponse.json();
            console.log('Registered:', registerData);

            // Login again
            const loginResponse2 = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123'
                })
            });
            const loginData2 = await loginResponse2.json();
            var token = loginData2.token;
        } else {
            const loginData = await loginResponse.json();
            var token = loginData.token;
        }

        console.log('✅ Logged in successfully');
        console.log('Token:', token.substring(0, 20) + '...');

        console.log('\n2. Creating journal entry...');
        const journalResponse = await fetch(`${API_URL}/journals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'Test Journal Entry',
                content: 'I am feeling very happy today! This is a test to see if the AI models work correctly.',
                mood: 'happy',
                tags: ['test', 'happy']
            })
        });

        const journalData = await journalResponse.json();

        if (journalResponse.ok) {
            console.log('✅ Journal entry created successfully!');
            console.log('Journal ID:', journalData.journal.id);
            console.log('Sentiment:', journalData.journal.sentiment);
            console.log('Confidence:', journalData.journal.confidence);
            console.log('Emotions:', journalData.journal.emotions);
            console.log('Suggestions:', journalData.journal.suggestions);
            console.log('\n🎉 TEST PASSED! The journal creation is working correctly.');
        } else {
            console.log('❌ Journal creation failed');
            console.log('Error:', journalData);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testJournalCreation();
