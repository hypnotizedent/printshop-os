#!/bin/bash
# Test Printavo API Connection
# This script will prompt for your credentials securely and test the connection

set -e

echo "=== Printavo API Connection Test ==="
echo ""
echo "This script will test your Printavo API credentials."
echo "Your credentials will not be saved or logged."
echo ""

# Prompt for credentials
read -p "Enter your Printavo email: " PRINTAVO_EMAIL
read -s -p "Enter your Printavo API token: " PRINTAVO_TOKEN
echo ""
echo ""

# Export credentials for the test script
export PRINTAVO_EMAIL
export PRINTAVO_TOKEN

# Run the test
cd "$(dirname "$0")/../lib/ptavo/examples"
node test_api.js

# Unset credentials
unset PRINTAVO_EMAIL
unset PRINTAVO_TOKEN

echo ""
echo "Test complete. Credentials cleared from memory."
