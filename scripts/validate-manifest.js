#!/usr/bin/env node

// YUV.AI SocialBot Pro - Manifest Validator
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating manifest.json...');

try {
    // Read manifest.json
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    console.log('✅ manifest.json is valid JSON');

    // Check required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'permissions'];
    const missingFields = requiredFields.filter(field => !manifest[field]);

    if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields.join(', '));
        process.exit(1);
    }

    console.log('✅ All required fields present');

    // Check manifest version
    if (manifest.manifest_version !== 3) {
        console.error('❌ Manifest version should be 3');
        process.exit(1);
    }

    console.log('✅ Manifest version 3 confirmed');

    // Check if files exist
    const filesToCheck = [
        'popup.html',
        'popup.js', 
        'popup.css',
        'content.js',
        'content.css',
        'background.js'
    ];

    const missingFiles = filesToCheck.filter(file => {
        const filePath = path.join(__dirname, '..', file);
        return !fs.existsSync(filePath);
    });

    if (missingFiles.length > 0) {
        console.error('❌ Missing files:', missingFiles.join(', '));
        process.exit(1);
    }

    console.log('✅ All referenced files exist');

    // Check icons
    const iconSizes = ['16', '48', '128'];
    const missingIcons = iconSizes.filter(size => {
        const iconPath = path.join(__dirname, '..', 'icons', `icon${size}.png`);
        return !fs.existsSync(iconPath);
    });

    if (missingIcons.length > 0) {
        console.error('❌ Missing icons for sizes:', missingIcons.join(', '));
        process.exit(1);
    }

    console.log('✅ All icons present');

    // Check YUV.AI branding
    if (!manifest.name.includes('YUV.AI')) {
        console.warn('⚠️  YUV.AI branding should be included in name');
    }

    if (!manifest.description.includes('YUV.AI')) {
        console.warn('⚠️  YUV.AI branding should be included in description');
    }

    console.log('🎉 Manifest validation completed successfully!');
    console.log(`📦 Extension: ${manifest.name} v${manifest.version}`);
    console.log('🚀 FLY HIGH WITH YUV.AI');

} catch (error) {
    console.error('❌ Manifest validation failed:', error.message);
    process.exit(1);
} 