// Comprehensive module test for Sentiment Analyzer
const API_URL = 'http://localhost:5000/api';

let authToken = '';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
};

async function testModule(name, testFn) {
    try {
        log(`\n🧪 Testing: ${name}`, 'blue');
        await testFn();
        log(`✅ PASSED: ${name}`, 'green');
        results.passed++;
        results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
        log(`❌ FAILED: ${name} - ${error.message}`, 'red');
        results.failed++;
        results.tests.push({ name, status: 'FAILED', error: error.message });
    }
}

// 1. Authentication Module
async function testAuth() {
    // Register
    const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Module Test User',
            email: `test_${Date.now()}@example.com`,
            password: 'testpass123'
        })
    });

    if (!registerRes.ok) {
        // Try login if user exists
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        authToken = loginData.token;
    } else {
        const data = await registerRes.json();
        authToken = data.token;
    }

    if (!authToken) throw new Error('No auth token received');
}

// 2. Analyze Module
async function testAnalyze() {
    const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ text: 'I am feeling great today!' })
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('Analysis failed');
    if (!data.analysis.sentiment) throw new Error('No sentiment in response');
}

// 3. Journal Module
async function testJournal() {
    // Create journal
    const createRes = await fetch(`${API_URL}/journals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            title: 'Test Journal',
            content: 'This is a test journal entry',
            mood: 'happy'
        })
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) throw new Error('Journal creation failed');

    const journalId = createData.journal.id;

    // Get journals
    const getRes = await fetch(`${API_URL}/journals`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const getData = await getRes.json();
    if (!getRes.ok || !getData.success) throw new Error('Get journals failed');

    // Get single journal
    const singleRes = await fetch(`${API_URL}/journals/${journalId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const singleData = await singleRes.json();
    if (!singleRes.ok || !singleData.success) throw new Error('Get single journal failed');
}

// 4. Dashboard Module
async function testDashboard() {
    const statsRes = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const statsData = await statsRes.json();
    if (!statsRes.ok || !statsData.success) throw new Error('Dashboard stats failed');

    const trendRes = await fetch(`${API_URL}/dashboard/trend?days=7`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const trendData = await trendRes.json();
    if (!trendRes.ok || !trendData.success) throw new Error('Dashboard trend failed');
}

// 5. Results Module
async function testResults() {
    const res = await fetch(`${API_URL}/results`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Results fetch failed');
}

// 6. Insights Module
async function testInsights() {
    const res = await fetch(`${API_URL}/insights`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Insights fetch failed');
}

// 7. Streaks Module
async function testStreaks() {
    const res = await fetch(`${API_URL}/streaks`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Streaks fetch failed');
}

// 8. Search Module
async function testSearch() {
    const res = await fetch(`${API_URL}/search?q=test`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Search failed');
}

// 9. Appointments Module
async function testAppointments() {
    const res = await fetch(`${API_URL}/appointments`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Appointments fetch failed');
}

// 10. Prompts Module
async function testPrompts() {
    const res = await fetch(`${API_URL}/prompts`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Prompts fetch failed');
}

// 11. Predictions Module
async function testPredictions() {
    const res = await fetch(`${API_URL}/predictions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Predictions fetch failed');
}

// 12. Sharing Module
async function testSharing() {
    const res = await fetch(`${API_URL}/sharing/reports`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Sharing fetch failed');
}

// 13. Accountability Module
async function testAccountability() {
    const res = await fetch(`${API_URL}/accountability/partners`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('Accountability fetch failed');
}

// 14. History Module
async function testHistory() {
    const res = await fetch(`${API_URL}/history`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('History fetch failed');
}

// Run all tests
async function runAllTests() {
    log('\n' + '='.repeat(60), 'blue');
    log('🚀 SENTIMENT ANALYZER - COMPREHENSIVE MODULE TEST', 'blue');
    log('='.repeat(60) + '\n', 'blue');

    await testModule('1. Authentication (Register/Login)', testAuth);
    await testModule('2. Analyze (Sentiment Analysis)', testAnalyze);
    await testModule('3. Journal (CRUD Operations)', testJournal);
    await testModule('4. Dashboard (Stats & Trends)', testDashboard);
    await testModule('5. Results', testResults);
    await testModule('6. Insights', testInsights);
    await testModule('7. Streaks', testStreaks);
    await testModule('8. Search', testSearch);
    await testModule('9. Appointments', testAppointments);
    await testModule('10. Prompts', testPrompts);
    await testModule('11. Predictions', testPredictions);
    await testModule('12. Sharing', testSharing);
    await testModule('13. Accountability', testAccountability);
    await testModule('14. History', testHistory);

    // Print summary
    log('\n' + '='.repeat(60), 'blue');
    log('📊 TEST SUMMARY', 'blue');
    log('='.repeat(60), 'blue');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`⏭️  Skipped: ${results.skipped}`, 'yellow');
    log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, 'blue');
    log('='.repeat(60) + '\n', 'blue');

    // Print detailed results
    if (results.failed > 0) {
        log('\n❌ FAILED TESTS:', 'red');
        results.tests.filter(t => t.status === 'FAILED').forEach(t => {
            log(`  - ${t.name}: ${t.error}`, 'red');
        });
    }

    if (results.passed === results.tests.length) {
        log('\n🎉 ALL TESTS PASSED! Application is fully functional.', 'green');
    } else {
        log(`\n⚠️  ${results.failed} test(s) failed. Review the errors above.`, 'yellow');
    }
}

runAllTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
});
