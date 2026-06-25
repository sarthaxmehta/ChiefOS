require('dotenv').config({ path: '.env.local' });
const { streamText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function main() {
  try {
    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: [{ role: 'user', content: 'hello' }]
    });
    
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } catch (e) {
    console.error("ERROR:", e);
  }
}
main();
