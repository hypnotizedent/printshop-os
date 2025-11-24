/**
 * Basic Usage Example for AI Quote Optimizer
 * 
 * This example demonstrates how to use the QuoteOptimizer
 * in a real application scenario.
 */

import { createQuoteOptimizer } from '../lib';

async function main() {
  // Initialize the optimizer with your OpenAI API key
  const optimizer = createQuoteOptimizer({
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    enableCaching: true,
    cacheExpiry: 3600, // 1 hour
    maxCostPerAnalysis: 0.05,
  });

  console.log('🚀 AI Quote Optimizer - Example Usage\n');

  // Example 1: Simple Logo Design
  console.log('Example 1: Simple Logo Design');
  console.log('================================\n');
  
  try {
    const result1 = await optimizer.optimizeQuote({
      imageUrl: 'https://example.com/simple-logo.png',
      quantity: 50,
    });

    console.log('Print Configuration:');
    console.log(`  - Location: ${result1.printConfig.location}`);
    console.log(`  - Size: ${result1.printConfig.size}`);
    console.log(`  - Method: ${result1.printConfig.method}`);
    console.log(`  - Colors: ${result1.printConfig.colors}`);
    console.log(`  - Confidence: ${(result1.printConfig.confidence * 100).toFixed(1)}%`);
    
    console.log(`\nEstimated Value: $${result1.estimatedValue.toFixed(2)}`);
    
    console.log(`\nTop Suggestions (${result1.suggestions.length}):`);
    result1.suggestions.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.title} (+$${s.priceImpact.toFixed(2)})`);
      console.log(`     ${s.description}`);
    });

    if (result1.issues.length > 0) {
      console.log(`\n⚠️  Issues Detected (${result1.issues.length}):`);
      result1.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        console.log(`     Resolution: ${issue.resolution}`);
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('Error in Example 1:', error);
  }

  // Example 2: Complex Design with Deadline
  console.log('Example 2: Complex Design with Rush Deadline');
  console.log('=============================================\n');

  try {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 4); // 4 days from now

    const result2 = await optimizer.optimizeQuote({
      imageUrl: 'https://example.com/complex-design.png',
      quantity: 250,
      deadline: deadline,
      customerInfo: {
        hasExistingBranding: true,
        isRetailJob: true,
      },
    });

    console.log('Print Configuration:');
    console.log(`  - Location: ${result2.printConfig.location}`);
    console.log(`  - Size: ${result2.printConfig.size}`);
    console.log(`  - Method: ${result2.printConfig.method}`);
    console.log(`  - Colors: ${result2.printConfig.colors}`);
    
    console.log(`\nEstimated Value: $${result2.estimatedValue.toFixed(2)}`);
    
    console.log('\nReasoning:');
    console.log(`  ${result2.reasoning}`);

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('Error in Example 2:', error);
  }

  // Example 3: Batch Processing
  console.log('Example 3: Batch Processing Multiple Designs');
  console.log('=============================================\n');

  try {
    const batchInputs = [
      { imageUrl: 'https://example.com/design1.png', quantity: 50 },
      { imageUrl: 'https://example.com/design2.png', quantity: 100 },
      { imageUrl: 'https://example.com/design3.png', quantity: 250 },
    ];

    console.log(`Processing ${batchInputs.length} designs in batch...\n`);

    const batchResults = await optimizer.optimizeQuoteBatch(batchInputs);

    batchResults.forEach((result, i) => {
      console.log(`Design ${i + 1}:`);
      console.log(`  Estimated Value: $${result.estimatedValue.toFixed(2)}`);
      console.log(`  Print Method: ${result.printConfig.method}`);
      console.log(`  Suggestions: ${result.suggestions.length}`);
      console.log(`  Issues: ${result.issues.length}`);
      console.log('');
    });

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('Error in Example 3:', error);
  }

  // Display Cost Summary
  console.log('Cost Summary');
  console.log('=============\n');

  const costTracking = optimizer.getCostTracking();
  const totalCost = optimizer.getTotalCost();
  const cacheHits = costTracking.filter(t => t.cacheHit).length;

  console.log(`Total API Calls: ${costTracking.length}`);
  console.log(`Cache Hits: ${cacheHits} (${((cacheHits / costTracking.length) * 100).toFixed(1)}%)`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`Average Cost per Analysis: $${(totalCost / costTracking.length).toFixed(4)}`);

  console.log('\n✅ Example complete!\n');
}

// Run the examples
if (require.main === module) {
  main().catch(console.error);
}

export { main as runExamples };
