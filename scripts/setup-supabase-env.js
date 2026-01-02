#!/usr/bin/env node
/**
 * Setup Supabase Environment Variables
 * 
 * This script helps set up .env file with Supabase credentials.
 * It can read from:
 * 1. antigravity-keys.json file (exported from admin panel)
 * 2. Command line arguments
 * 3. Interactive prompts
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const CONFIG_FILE = path.join(__dirname, '..', 'docs', 'supabaseeditor', 'antigravity-keys.json');

function readConfigFile() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(content);
      if (config.projectRef && config.projectRef !== 'INSERT_PROJECT_REF_HERE') {
        return config;
      }
    }
  } catch (e) {
    // File doesn't exist or invalid
  }
  return null;
}

function createEnvFile(config) {
  const { projectRef, serviceRoleKey } = config;
  
  // Construct Supabase URL
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  
  // For anon key, we need to get it from Supabase Dashboard
  // Service role key can be used temporarily, but anon key is preferred for frontend
  const anonKey = config.anonKey || serviceRoleKey || 'YOUR_ANON_KEY_HERE';
  
  const envContent = `# Supabase Configuration
# Generated from antigravity-keys.json
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_PUBLISHABLE_KEY=${anonKey}
VITE_SUPABASE_PROJECT_ID=${projectRef}

# Note: If anonKey is not set, you need to get it from:
# Supabase Dashboard > Project Settings > API > anon/public key
`;

  fs.writeFileSync(ENV_FILE, envContent);
  console.log(`✅ Created .env file with project: ${projectRef}`);
  console.log(`⚠️  Note: You may need to update VITE_SUPABASE_PUBLISHABLE_KEY with your anon key`);
  console.log(`   Get it from: Supabase Dashboard > Project Settings > API`);
}

// Main execution
const config = readConfigFile();

if (config) {
  console.log('📋 Found antigravity-keys.json');
  console.log(`   Project Ref: ${config.projectRef}`);
  createEnvFile(config);
} else {
  console.log('❌ antigravity-keys.json not found or not configured');
  console.log('');
  console.log('Please either:');
  console.log('1. Export config from Admin > Supabase > Settings > Export Config');
  console.log('2. Or run this script with arguments:');
  console.log('   node scripts/setup-supabase-env.js <projectRef> <anonKey>');
  console.log('');
  console.log('Example:');
  console.log('   node scripts/setup-supabase-env.js abcdefghijklmno eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const [projectRef, anonKey] = args;
    createEnvFile({ projectRef, anonKey });
  }
}

