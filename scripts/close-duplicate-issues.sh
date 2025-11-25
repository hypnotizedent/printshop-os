#!/bin/bash

# Script to close duplicate GitHub issues that were completed via PRs

echo "Closing duplicate GitHub issues..."

# Issue #116 - Support Ticketing System
gh issue close 116 --comment "✅ Completed via merged PR (Support Ticketing System). All support ticket functionality has been implemented and merged into main. Closing as duplicate tracking."

# Issue #117 - Quote Approval & Digital Signature  
gh issue close 117 --comment "✅ Completed via merged PR (Quote Approval System). Quote approval workflow with digital signatures has been implemented and merged into main. Closing as duplicate tracking."

# Issue #118 - Time Clock & Job Detail
gh issue close 118 --comment "✅ Completed via merged PR #139 (Time Clock & Job Detail Capture). Time tracking and job detail capture functionality has been implemented and merged into main. Closing as duplicate tracking."

# Issue #119 - SOP Library & Documentation
gh issue close 119 --comment "✅ Completed via merged PR #137 (SOP Library Dashboard). SOP library with search and documentation features has been implemented and merged into main. Closing as duplicate tracking."

# Issue #121 - Team Productivity Metrics
gh issue close 121 --comment "✅ Completed via merged PR #127 (Team Productivity Metrics & Analytics). Productivity metrics and analytics dashboard has been implemented and merged into main. Closing as duplicate tracking."

# Issue #123 - Mobile & Tablet Optimization
gh issue close 123 --comment "✅ Completed via merged PR #134 (Mobile & Tablet Optimization). Production dashboard has been optimized for mobile and tablet devices and merged into main. Closing as duplicate tracking."

# Issue #124 - Product Variants & SKU Mapping
gh issue close 124 --comment "✅ Completed via merged PR #129 (Product Variants & SKU Mapping System). Product variant and SKU mapping system for supplier integration has been implemented and merged into main. Closing as duplicate tracking."

echo "All duplicate issues closed successfully!"
