# Shopify CLI Setup Guide for Mint Prints

## 🎯 Quick Setup Steps

### 1. Create Development Store
```
1. Go to partners.shopify.com
2. Click "Stores" > "Add store"
3. Choose "Development store"
4. Store name: "Mint Prints Dev" (or similar)
5. Set password (you'll use this to access the store)
6. Click "Create store"
```

### 2. Install/Update Shopify CLI
```bash
# Install or update Shopify CLI
npm install -g @shopify/cli @shopify/theme

# Verify installation
shopify version
```

### 3. Login to Your Development Store
```bash
# Login to Shopify
shopify auth login

# Select your development store when prompted
# (Not your live store)
```

### 4. Initialize Theme Development
```bash
# Navigate to your Cursor project directory
cd /Users/ronnyworks/Documents/cursor

# Start theme development
shopify theme dev

# This will:
# - Connect to your development store
# - Start local development server
# - Sync your local files to the dev store
# - Watch for changes and auto-sync
```

## 🔧 Alternative: Manual Theme Upload

If you prefer manual upload:

### 1. Prepare Theme Files
```bash
# Create a zip file of your theme
cd /Users/ronnyworks/Documents/cursor
zip -r mint-prints-vessel-theme.zip . -x "*.git*" "node_modules/*" "*.DS_Store"
```

### 2. Upload to Development Store
```
1. Go to your development store admin
2. Online Store > Themes
3. Click "Add theme" > "Upload theme"
4. Select your zip file
5. Click "Upload"
6. Click "Publish" to make it live
```

## 📱 Development Workflow

### **Using CLI (Recommended)**
```bash
# Start development server
shopify theme dev

# This will:
# - Open your dev store in browser
# - Watch for file changes
# - Auto-sync changes to dev store
# - Show live preview
```

### **File Changes**
```bash
# When you edit files in Cursor:
# 1. Save the file
# 2. CLI automatically syncs to dev store
# 3. See changes immediately in browser
# 4. No manual upload needed
```

### **Testing Changes**
```bash
# Test on different devices:
# 1. Desktop: http://your-dev-store.myshopify.com
# 2. Mobile: Use browser dev tools
# 3. Real devices: Share dev store URL
```

## 🎨 Customizing Your Theme

### **1. Update Theme Settings**
```
1. In dev store admin: Online Store > Themes > Customize
2. Update colors, fonts, logo
3. Configure sections and blocks
4. Save changes
```

### **2. Add Your Content**
```
1. Pages: Add content to service pages
2. Images: Upload to Files section
3. Navigation: Configure menus
4. Forms: Test quote form functionality
```

### **3. Test Everything**
```
1. Homepage: Check all sections load
2. Service pages: Verify content and links
3. Quote form: Submit test requests
4. Mobile: Test responsive design
5. Performance: Check load times
```

## 🔄 Syncing with Live Store

### **When Ready to Deploy**
```bash
# Option 1: Export theme from dev store
1. Dev store admin > Online Store > Themes
2. Click "Actions" > "Download theme file"
3. Upload to live store

# Option 2: Use CLI to push to live store
shopify theme push --store=your-live-store.myshopify.com
```

## 🛠️ Troubleshooting

### **Common Issues**

#### **CLI Not Connecting**
```bash
# Re-authenticate
shopify auth logout
shopify auth login

# Check store selection
shopify config list
```

#### **Theme Not Syncing**
```bash
# Restart development server
Ctrl+C (stop current session)
shopify theme dev

# Check file permissions
ls -la
```

#### **Changes Not Appearing**
```bash
# Force refresh browser
Ctrl+Shift+R (hard refresh)

# Check dev store admin
# Sometimes changes need manual refresh
```

## 📋 Development Checklist

### **Setup Complete**
- [ ] Development store created
- [ ] CLI installed and logged in
- [ ] Theme files syncing
- [ ] Dev server running

### **Content Added**
- [ ] Logo and branding uploaded
- [ ] Service content added
- [ ] Images optimized and uploaded
- [ ] Navigation configured

### **Testing Complete**
- [ ] Homepage loads correctly
- [ ] Service pages display properly
- [ ] Quote form works
- [ ] Mobile responsive
- [ ] Performance acceptable

## 🎯 Next Steps After Setup

### **Week 1: Foundation**
1. **Upload core content** to dev store
2. **Test all functionality**
3. **Optimize performance**
4. **Get team feedback**

### **Week 2: Refinement**
1. **Add remaining content**
2. **Implement lazy loading**
3. **Create blog posts**
4. **Set up analytics**

### **Week 3: Launch Prep**
1. **Final testing**
2. **Performance optimization**
3. **SEO setup**
4. **Deploy to live store**

## 💡 Pro Tips

### **Development Best Practices**
- **Use dev store for all testing** - Never test on live store
- **Commit changes regularly** - Use git for version control
- **Test on multiple devices** - Mobile, tablet, desktop
- **Monitor performance** - Use browser dev tools

### **Content Management**
- **Organize files properly** - Use clear naming conventions
- **Optimize images** - Compress before upload
- **Backup regularly** - Export theme files periodically
- **Document changes** - Keep notes of customizations

---

**This setup gives you a safe, efficient way to develop and test your new Mint Prints website before launching to your live store.** 