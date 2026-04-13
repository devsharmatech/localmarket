
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testApi(endpoint, method, body) {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
            console.error(`❌ ${endpoint} Failed: ${res.status} ${res.statusText}`);
            try {
                const text = await res.text();
                console.error('Response:', text);
            } catch (e) { }
            return null;
        }

        const data = await res.json();
        return data;
    } catch (err) {
        console.error(`❌ Network Error calling ${endpoint}:`, err.message);
        return null; // Return null on error so caller can handle
    }
}

async function runScenario(scenarioName, intent, details, urgency, budget) {
    console.log(`\n--- 🧪 Testing Scenario: ${scenarioName} ---`);

    // 1. Start Session
    console.log('1. Starting Session...');
    const startData = await testApi('/api/ai/start', 'POST', { userId: 'test_user' });
    if (!startData) return;

    // 2. Process Answer (Intent)
    // Note: In real app, user types 'Plumber' which might match 'home_services' button or just be text
    // The current backend logic (process-answer) maps 'food' -> food options, 'repair' -> electronics, else -> home services
    console.log(`2. Sending Intent: "${intent}"...`);
    let context = {};
    let step = 'intent';

    // Simulate flow:
    // Step 1: Intent
    let stepData = await testApi('/api/ai/process-answer', 'POST', {
        step: 'intent',
        answer: intent,
        context
    });
    if (!stepData) return;
    context = stepData.updatedContext;
    console.log('   ✅ Intent processed. Next:', stepData.nextStep);

    // Step 2: Details
    stepData = await testApi('/api/ai/process-answer', 'POST', {
        step: 'details',
        answer: details,
        context
    });
    if (!stepData) return;
    context = stepData.updatedContext;
    console.log('   ✅ Details processed. Next:', stepData.nextStep);

    // Step 3: Urgency
    stepData = await testApi('/api/ai/process-answer', 'POST', {
        step: 'urgency',
        answer: urgency,
        context
    });
    if (!stepData) return;
    context = stepData.updatedContext;
    console.log('   ✅ Urgency processed. Next:', stepData.nextStep);

    // Step 4: Budget
    stepData = await testApi('/api/ai/process-answer', 'POST', {
        step: 'budget',
        answer: budget,
        context
    });
    if (!stepData) return;
    context = stepData.updatedContext;
    console.log('   ✅ Budget processed. Ready:', stepData.ready);

    // Final Recommendation Call
    if (stepData.nextStep === 'results') {
        console.log('6. Fetching Recommendations with context:', JSON.stringify(context));
        const recData = await testApi('/api/ai/recommendations', 'POST', {
            context: context,
            location: { city: 'Ambala' }
        });

        if (recData && recData.vendors) {
            console.log(`   ✅ Success! ${recData.vendors.length} vendors returned.`);
            if (recData.vendors.length > 0) {
                console.log('   Top Match:', recData.vendors[0].name, `(${recData.vendors[0].service})`);
            }
            if (recData.meta) {
                console.log('   AI Filter Used:', recData.meta.filterUsed);
            }
        } else {
            console.error('   ❌ Failed to get valid recommendations.');
        }
    }
}

async function runTests() {
    console.log('Attempting to connect to ' + BASE_URL);

    // Case 1: Valid
    // Intent 'repair' triggers the electronics flow in process-answer/route.ts
    // Intent 'food' triggers food
    // Other triggers home services

    // Test Generic Home Service
    await runScenario('Home Service (Plumber)', 'I need a plumber', 'Leaking tap', 'Today', 'Standard');

    // Test Food
    await runScenario('Food Cravings', 'food', 'North Indian', 'Now', 'Medium');

    // Test Invalid/Off-topic
    await runScenario('Invalid Request', 'Tell me a joke about robots', 'Make it funny', 'Now', 'Free');
}

runTests();
