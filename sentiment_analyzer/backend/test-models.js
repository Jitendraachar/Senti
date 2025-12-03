import { pipeline } from '@xenova/transformers';

console.log('Starting model test...');
console.log('This will download models (may take 1-2 minutes)...\n');

async function testModels() {
    try {
        console.log('1. Testing sentiment analysis model...');
        const sentiment = await pipeline('sentiment-analysis', 'Xenova/twitter-roberta-base-sentiment-latest');
        console.log('✅ Sentiment model loaded!');

        const result = await sentiment('I am happy');
        console.log('✅ Sentiment test result:', result);

        console.log('\n2. Testing emotion detection model...');
        const emotion = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-emotion');
        console.log('✅ Emotion model loaded!');

        const emotionResult = await emotion('I am happy');
        console.log('✅ Emotion test result:', emotionResult);

        console.log('\n🎉 ALL TESTS PASSED! Models are working correctly.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

testModels();
