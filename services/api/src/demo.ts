/**
 * Demo script to test Analytics API endpoints
 * Run with: ts-node src/demo.ts
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3002';

interface TestResult {
  endpoint: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  error?: string;
}

async function testEndpoint(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    console.log(`\nTesting: ${endpoint}`);
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    console.log(`✓ Status: ${response.status}`);
    console.log(`✓ Response time: ${responseTime}ms`);
    console.log(`✓ Data keys:`, Object.keys(response.data).join(', '));
    
    return {
      endpoint,
      status: 'PASS',
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.log(`✗ Error: ${error.message}`);
    
    return {
      endpoint,
      status: 'FAIL',
      responseTime,
      error: error.message,
    };
  }
}

async function runDemo() {
  console.log('='.repeat(60));
  console.log('PrintShop OS Analytics API - Demo & Test Suite');
  console.log('='.repeat(60));
  
  const results: TestResult[] = [];
  
  // Test 1: API Root
  results.push(await testEndpoint('/api/analytics'));
  
  // Test 2: Health Check
  results.push(await testEndpoint('/health'));
  
  // Test 3: Revenue Analytics - Default
  results.push(await testEndpoint('/api/analytics/revenue'));
  
  // Test 4: Revenue Analytics - Weekly
  results.push(
    await testEndpoint('/api/analytics/revenue', {
      period: 'week',
      group_by: 'day',
    })
  );
  
  // Test 5: Revenue Analytics - Custom Date Range
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  results.push(
    await testEndpoint('/api/analytics/revenue', {
      start_date: startDate,
      end_date: endDate,
    })
  );
  
  // Test 6: Product Analytics
  results.push(await testEndpoint('/api/analytics/products'));
  
  // Test 7: Product Analytics - Top 5 by Units
  results.push(
    await testEndpoint('/api/analytics/products', {
      limit: '5',
      sort_by: 'units',
    })
  );
  
  // Test 8: Customer Analytics
  results.push(await testEndpoint('/api/analytics/customers'));
  
  // Test 9: Customer Analytics - VIP Customers
  results.push(
    await testEndpoint('/api/analytics/customers', {
      min_ltv: '10000',
      limit: '5',
    })
  );
  
  // Test 10: Order Metrics
  results.push(await testEndpoint('/api/analytics/orders'));
  
  // Test 11: Order Metrics - Weekly
  results.push(
    await testEndpoint('/api/analytics/orders', {
      period: 'week',
    })
  );
  
  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  - ${r.endpoint}: ${r.error}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nNext Steps:');
  console.log('1. View API Documentation: http://localhost:3002/api-docs');
  console.log('2. Test endpoints with curl or Postman');
  console.log('3. Check ANALYTICS_API.md for detailed documentation');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error: any) => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});

// Run demo
runDemo().catch((error) => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
