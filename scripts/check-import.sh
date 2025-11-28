#!/bin/bash
# Quick import status check
echo "=== PrintShop Import Status ==="
echo "Time: $(date)"

CUSTOMERS=$(ssh docker-host 'curl -s --max-time 5 "http://localhost:1337/api/customers?pagination\[limit\]=1" 2>/dev/null | jq -r ".meta.pagination.total // \"N/A\""')
ORDERS=$(ssh docker-host 'curl -s --max-time 5 "http://localhost:1337/api/orders?pagination\[limit\]=1" 2>/dev/null | jq -r ".meta.pagination.total // \"N/A\""')

echo "Customers: $CUSTOMERS / 3,358"
echo "Orders:    $ORDERS / 12,867"

# Check if import process is running
if pgrep -f "robust-import" > /dev/null; then
    echo "Import: RUNNING ✓"
else
    echo "Import: NOT RUNNING ✗"
fi
