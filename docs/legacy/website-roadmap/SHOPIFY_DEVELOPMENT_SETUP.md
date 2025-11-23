# Shopify Development Store Setup Guide

## 🚀 Quick Setup for Theme Preview

### 1. Create Development Store
```
1. Go to partners.shopify.com
2. Sign up for a free Shopify Partner account
3. Click "Stores" > "Add store" > "Development store"
4. Choose "Development store" (free, no credit card required)
5. Fill in basic store details
6. Set store password (you'll use this to access your store)
```

### 2. Install Vessel Theme
```
1. In your development store admin, go to "Online Store" > "Themes"
2. Click "Add theme" > "Upload theme"
3. Upload the Vessel theme files from your Cursor project
4. Click "Publish" to make it live
```

### 3. Apply Your Customizations
```
1. Go to "Online Store" > "Themes" > "Customize"
2. Upload your images to "Files" in Shopify admin
3. Update the templates we created
4. Configure colors and typography
5. Test all functionality
```

### 4. Preview Your Changes
```
- Use the theme customizer for live preview
- Test on mobile devices
- Check all pages and forms
- Verify navigation and links
```

## 🔧 Alternative: Shopify CLI (Advanced)

If you're comfortable with command line:

```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/theme

# Login to your development store
shopify auth login

# Start local development server
shopify theme dev

# This will sync your local files to the development store
```

## 📱 Testing Checklist

### Desktop Testing
- [ ] Homepage loads correctly
- [ ] Service pages display properly
- [ ] Quote form works
- [ ] Navigation functions
- [ ] Images load properly

### Mobile Testing
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Forms are mobile-friendly
- [ ] Navigation is accessible
- [ ] Images scale properly

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] Images optimized
- [ ] No broken links
- [ ] Forms submit successfully
- [ ] No console errors
```

## 🎯 Benefits of Development Store

### ✅ Advantages
- **Free to use** - No monthly costs
- **Full functionality** - All Shopify features available
- **Live preview** - See changes immediately
- **Testing environment** - Safe to experiment
- **Easy deployment** - Can transfer to production later

### ⚠️ Limitations
- **Subdomain** - Your store will be on a .myshopify.com domain
- **No real transactions** - Can't process actual payments
- **Limited apps** - Some apps may not work in development mode

## 🚀 Next Steps After Setup

1. **Upload your content** - Add all your text and images
2. **Test thoroughly** - Check every page and function
3. **Optimize performance** - Compress images, check load times
4. **Get feedback** - Share with team or test users
5. **Prepare for launch** - Transfer to production store when ready 