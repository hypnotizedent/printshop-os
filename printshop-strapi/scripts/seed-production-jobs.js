/**
 * Seed Script: Production Jobs
 * 
 * This script creates sample job data for testing the Production Dashboard.
 * Run with: node scripts/seed-production-jobs.js
 * 
 * Prerequisites:
 * - Strapi must be running
 * - Customer collection must exist with at least one customer
 * - Job collection must be configured
 * - Required npm packages: axios, moment (should be installed with Strapi)
 * 
 * Installation (if packages missing):
 *   npm install axios moment
 */

const axios = require('axios');
const moment = require('moment');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

// If no API token is provided, the script will create data directly via API
// You can set STRAPI_API_TOKEN environment variable or update this value
const useDirectAPI = !API_TOKEN;

// Sample job data templates
const jobTemplates = [
  {
    jobNumber: 'JOB-2025-001',
    title: 'Corporate T-Shirts - Acme Corp',
    status: 'InProduction',
    dueDate: moment().add(3, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Rush order - Need to complete by end of week. Front logo print only. Use Gildan 5000 shirts.',
    customerNotes: 'Client requested specific Pantone color match: 186C',
    totalAmount: 450.00,
    amountPaid: 450.00,
    paymentStatus: 'Paid',
    mockupUrls: [
      'https://via.placeholder.com/600x800/2196F3/ffffff?text=Acme+Corp+Logo'
    ],
    artFileUrls: [
      'https://example.com/art/acme-corp-logo.ai'
    ]
  },
  {
    jobNumber: 'JOB-2025-002',
    title: 'Event Hoodies - Tech Startup',
    status: 'InProduction',
    dueDate: moment().add(5, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Front chest logo + large back print. Use water-based inks. Pre-shrunk hoodies.',
    customerNotes: 'Event is next week - cannot be late!',
    totalAmount: 1250.00,
    amountPaid: 625.00,
    paymentStatus: 'Partial',
    mockupUrls: [
      'https://via.placeholder.com/600x800/4CAF50/ffffff?text=Startup+Event+2025',
      'https://via.placeholder.com/600x800/4CAF50/ffffff?text=Back+Design'
    ],
    artFileUrls: [
      'https://example.com/art/startup-front.ai',
      'https://example.com/art/startup-back.ai'
    ]
  },
  {
    jobNumber: 'JOB-2025-003',
    title: 'School Spirit Wear - Lincoln High',
    status: 'InProduction',
    dueDate: moment().add(2, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Multi-color print - 4 colors front. Need to separate colors manually. Use soft hand inks.',
    customerNotes: 'School colors must be exact - they provided PMS swatches',
    totalAmount: 890.00,
    amountPaid: 890.00,
    paymentStatus: 'Paid',
    mockupUrls: [
      'https://via.placeholder.com/600x800/FF9800/ffffff?text=Lincoln+High+Mascot'
    ],
    artFileUrls: [
      'https://example.com/art/lincoln-high.ai'
    ]
  },
  {
    jobNumber: 'JOB-2025-004',
    title: 'Band Merchandise - The Rockers',
    status: 'InProduction',
    dueDate: moment().add(7, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Discharge print on black shirts. Front + back + sleeve prints. High quality required.',
    customerNotes: 'Will be sold at concert tour - need premium finish',
    totalAmount: 2100.00,
    amountPaid: 1050.00,
    paymentStatus: 'Partial',
    mockupUrls: [
      'https://via.placeholder.com/600x800/000000/ffffff?text=Band+Tour+2025'
    ],
    artFileUrls: [
      'https://example.com/art/band-merch.ai'
    ]
  },
  {
    jobNumber: 'JOB-2025-005',
    title: 'Restaurant Uniforms - Bella Italia',
    status: 'Ready',
    dueDate: moment().add(1, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Embroidery on polo shirts - left chest logo. All prep work complete, ready for production.',
    customerNotes: 'Need by tomorrow for grand opening',
    totalAmount: 680.00,
    amountPaid: 680.00,
    paymentStatus: 'Paid',
    mockupUrls: [
      'https://via.placeholder.com/600x800/DC2626/ffffff?text=Bella+Italia+Logo'
    ],
    artFileUrls: [
      'https://example.com/art/bella-italia.dst'
    ]
  },
  {
    jobNumber: 'JOB-2025-006',
    title: 'Charity Run Shirts - Hope Foundation',
    status: 'Pending',
    dueDate: moment().add(10, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Waiting on final artwork approval from client',
    customerNotes: 'Design still being finalized',
    totalAmount: 550.00,
    amountPaid: 0.00,
    paymentStatus: 'Unpaid',
    mockupUrls: [
      'https://via.placeholder.com/600x800/9C27B0/ffffff?text=Hope+Run+2025'
    ],
    artFileUrls: []
  },
  {
    jobNumber: 'JOB-2025-007',
    title: 'Promo Tees - Marketing Agency',
    status: 'InProduction',
    dueDate: moment().add(4, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Simple 1-color print. High volume order. Use automatic press for speed.',
    customerNotes: 'Repeat customer - standard process',
    totalAmount: 325.00,
    amountPaid: 325.00,
    paymentStatus: 'Paid',
    mockupUrls: [
      'https://via.placeholder.com/600x800/00BCD4/ffffff?text=Promo+Design'
    ],
    artFileUrls: [
      'https://example.com/art/promo-tees.ai'
    ]
  },
  {
    jobNumber: 'JOB-2025-008',
    title: 'Trade Show Polos - Enterprise Co',
    status: 'Complete',
    dueDate: moment().subtract(2, 'days').format('YYYY-MM-DD'),
    productionNotes: 'Completed and ready for pickup. Left chest embroidery with company logo.',
    customerNotes: 'Job completed successfully',
    totalAmount: 1450.00,
    amountPaid: 1450.00,
    paymentStatus: 'Paid',
    mockupUrls: [
      'https://via.placeholder.com/600x800/607D8B/ffffff?text=Enterprise+Logo'
    ],
    artFileUrls: [
      'https://example.com/art/enterprise-logo.dst'
    ]
  }
];

/**
 * Create or get a test customer
 */
async function getOrCreateCustomer(apiClient) {
  try {
    // Try to get existing customers
    const response = await apiClient.get('/api/customers', {
      params: { 'pagination[limit]': 1 }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('✓ Using existing customer:', response.data.data[0].attributes.name);
      return response.data.data[0].id;
    }
    
    // Create a test customer if none exist
    console.log('Creating test customer...');
    const createResponse = await apiClient.post('/api/customers', {
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        companyName: 'Test Company Inc'
      }
    });
    
    console.log('✓ Created test customer');
    return createResponse.data.data.id;
  } catch (error) {
    console.error('Error getting/creating customer:', error.message);
    throw error;
  }
}

/**
 * Create sample jobs
 */
async function createJobs(apiClient, customerId) {
  console.log('\nCreating sample jobs...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const template of jobTemplates) {
    try {
      const jobData = {
        ...template,
        customer: customerId
      };
      
      // Check if job already exists
      const existingJobs = await apiClient.get('/api/jobs', {
        params: {
          'filters[jobNumber][$eq]': template.jobNumber
        }
      });
      
      if (existingJobs.data.data && existingJobs.data.data.length > 0) {
        console.log(`⊘ Job ${template.jobNumber} already exists - skipping`);
        continue;
      }
      
      // Create the job
      await apiClient.post('/api/jobs', {
        data: jobData
      });
      
      console.log(`✓ Created job: ${template.jobNumber} - ${template.title} [${template.status}]`);
      successCount++;
      
    } catch (error) {
      console.error(`✗ Failed to create job ${template.jobNumber}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n--- Summary ---`);
  console.log(`✓ Successfully created: ${successCount} jobs`);
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} jobs`);
  }
  console.log(`\nTotal jobs with status "InProduction": ${jobTemplates.filter(j => j.status === 'InProduction').length}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('======================================');
  console.log('Production Jobs Seed Script');
  console.log('======================================\n');
  console.log(`Strapi URL: ${STRAPI_URL}`);
  
  // Setup API client
  const apiClient = axios.create({
    baseURL: STRAPI_URL,
    headers: API_TOKEN ? {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    }
  });
  
  try {
    // Test connection
    console.log('\nTesting connection to Strapi...');
    await apiClient.get('/api/jobs', { params: { 'pagination[limit]': 1 } });
    console.log('✓ Connected to Strapi successfully\n');
    
    // Get or create customer
    const customerId = await getOrCreateCustomer(apiClient);
    
    // Create jobs
    await createJobs(apiClient, customerId);
    
    console.log('\n======================================');
    console.log('Seed script completed!');
    console.log('======================================\n');
    console.log('Next steps:');
    console.log('1. Open Appsmith dashboard at http://localhost:8080');
    console.log('2. Create or open the Production Dashboard app');
    console.log('3. The jobs should now be visible in the dashboard');
    console.log('4. Test filtering, viewing details, and updating status\n');
    
  } catch (error) {
    console.error('\n✗ Error running seed script:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (!API_TOKEN) {
      console.log('\n💡 Tip: Set STRAPI_API_TOKEN environment variable for authenticated requests');
      console.log('   Get token from: http://localhost:1337/admin → Settings → API Tokens');
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createJobs, getOrCreateCustomer };
