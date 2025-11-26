#!/usr/bin/env ts-node
/**
 * Seed Pricing Rules to Strapi
 * 
 * Loads sample pricing rules from JSON and creates them in Strapi
 * Usage: npx ts-node scripts/seed-pricing-rules.ts
 */

import fs from 'fs';
import path from 'path';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface PricingRule {
  id: string;
  description: string;
  version: number;
  effective_date: string;
  expiry_date?: string;
  conditions: Record<string, any>;
  calculations: Record<string, any>;
  priority: number;
  enabled: boolean;
}

async function seedPricingRules() {
  console.log('🌱 Seeding pricing rules to Strapi...\n');
  console.log(`📍 Strapi URL: ${STRAPI_URL}`);
  
  // Load sample rules
  const rulesPath = path.join(__dirname, '..', 'data', 'sample-pricing-rules.json');
  const rules: PricingRule[] = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  
  console.log(`📦 Found ${rules.length} rules to seed\n`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (STRAPI_API_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
  }
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const rule of rules) {
    try {
      // Check if rule already exists
      const checkResponse = await fetch(
        `${STRAPI_URL}/api/pricing-rules?filters[rule_id][$eq]=${encodeURIComponent(rule.id)}`,
        { headers }
      );
      
      if (!checkResponse.ok) {
        throw new Error(`Failed to check existing rule: ${checkResponse.status}`);
      }
      
      const checkData = await checkResponse.json();
      const existing = Array.isArray(checkData.data) ? checkData.data[0] : null;
      
      const strapiData = {
        rule_id: rule.id,
        description: rule.description,
        version: rule.version,
        effective_date: rule.effective_date,
        expiry_date: rule.expiry_date || null,
        conditions: rule.conditions,
        calculations: rule.calculations,
        priority: rule.priority,
        enabled: rule.enabled,
      };
      
      if (existing) {
        // Update existing rule
        const updateResponse = await fetch(
          `${STRAPI_URL}/api/pricing-rules/${existing.documentId}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({ data: strapiData }),
          }
        );
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update: ${updateResponse.status}`);
        }
        
        console.log(`✏️  Updated: ${rule.id}`);
        updated++;
      } else {
        // Create new rule
        const createResponse = await fetch(
          `${STRAPI_URL}/api/pricing-rules`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ data: strapiData }),
          }
        );
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Failed to create: ${createResponse.status} - ${errorText}`);
        }
        
        console.log(`✅ Created: ${rule.id}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error with ${rule.id}:`, error);
      errors++;
    }
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Seed Summary');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Created: ${created}`);
  console.log(`✏️  Updated: ${updated}`);
  console.log(`❌ Errors:  ${errors}`);
  console.log(`📦 Total:   ${rules.length}`);
  console.log('═══════════════════════════════════════\n');
  
  if (errors > 0) {
    process.exit(1);
  }
}

// Verify Strapi is running
async function checkStrapi(): Promise<boolean> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/pricing-rules`);
    return response.ok || response.status === 403; // 403 means API exists but needs auth
  } catch {
    return false;
  }
}

async function main() {
  const strapiReady = await checkStrapi();
  
  if (!strapiReady) {
    console.error('❌ Cannot connect to Strapi at', STRAPI_URL);
    console.error('   Please ensure Strapi is running: npm run develop');
    process.exit(1);
  }
  
  await seedPricingRules();
}

main().catch(console.error);
