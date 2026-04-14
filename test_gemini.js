const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    const apiKey = '';
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log('Testing gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello');
        console.log('Success:', result.response.text());
    } catch (error) {
        console.error('Error with gemini-1.5-flash:', error.status, error.statusText, error.errorDetails);

        try {
            console.log('Attempting to list models...');
            // listing models requires a different approach or might not be supported easily here
        } catch (e) { }
    }
}

testGemini();
