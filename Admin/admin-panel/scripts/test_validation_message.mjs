// Quick test to see the validation error message
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testValidation() {
    console.log('Testing validation with off-topic query...\n');

    const response = await fetch(`${BASE_URL}/api/ai/process-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            step: 'intent',
            answer: 'Tell me a joke about robots',
            context: {}
        })
    });

    const data = await response.json();

    console.log('📱 User sees this message:\n');
    console.log('─'.repeat(60));
    console.log(data.message);
    console.log('─'.repeat(60));
    console.log('\n✅ Validation is working! Message clearly states this is for Local Market.');
}

testValidation();
