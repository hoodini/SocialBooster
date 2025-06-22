#!/usr/bin/env node

// YUV.AI SocialBot Pro - Extension Packager
const fs = require('fs');
const path = require('path');

console.log('📦 Packaging YUV.AI SocialBot Pro Extension...');

try {
    // Read manifest for version info
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    console.log(`📋 Extension: ${manifest.name}`);
    console.log(`🏷️  Version: ${manifest.version}`);
    console.log(`📝 Description: ${manifest.description}`);
    
    // Create dist directory
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath);
        console.log('📁 Created dist directory');
    }
    
    // Files to include in package
    const filesToPackage = [
        'manifest.json',
        'popup.html',
        'popup.js',
        'popup.css',
        'content.js', 
        'content.css',
        'background.js',
        'README.md'
    ];
    
    // Directories to include
    const dirsToPackage = ['icons'];
    
    console.log('\n📋 Files to package:');
    filesToPackage.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
            console.log(`   ✅ ${file} (${sizeKB} KB)`);
        } else {
            console.log(`   ❌ ${file} (MISSING)`);
        }
    });
    
    console.log('\n📂 Directories to package:');
    dirsToPackage.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            console.log(`   ✅ ${dir}/ (${files.length} files)`);
            files.forEach(file => {
                console.log(`      - ${file}`);
            });
        } else {
            console.log(`   ❌ ${dir}/ (MISSING)`);
        }
    });
    
    // Package summary
    console.log('\n📊 Package Summary:');
    console.log('='.repeat(50));
    console.log(`📦 Extension Name: ${manifest.name}`);
    console.log(`🏷️  Version: ${manifest.version}`);
    console.log(`🔧 Manifest Version: ${manifest.manifest_version}`);
    console.log(`🌐 Platforms: LinkedIn, Facebook`);
    console.log(`🤖 AI Model: command-a-03-2025 (Cohere)`);
    console.log(`👨‍💻 Creator: Yuval Avidani (YUV.AI)`);
    
    // Features summary
    console.log('\n🌟 Features Included:');
    console.log('   ✅ Cohere AI Integration');
    console.log('   ✅ Persona Management');
    console.log('   ✅ Auto Likes (1.5s)');
    console.log('   ✅ Auto Comments (3s)');
    console.log('   ✅ LinkedIn Support');
    console.log('   ✅ Facebook Support');
    console.log('   ✅ Streaming Response');
    console.log('   ✅ Statistics Tracking');
    console.log('   ✅ Hebrew & English Support');
    console.log('   ✅ YUV.AI Branding');
    
    // Installation instructions
    console.log('\n🛠️  Installation Instructions:');
    console.log('1. Open Chrome and go to chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked"');
    console.log('4. Select this directory');
    console.log('5. Get your Cohere API key from dashboard.cohere.com');
    console.log('6. Configure your personas and settings');
    
    // Social links
    console.log('\n🔗 Creator Social Links:');
    console.log('   🌐 Linktr.ee: https://linktr.ee/yuvai');
    console.log('   💼 LinkedIn: https://www.linkedin.com/in/🎗️yuval-avidani-87081474/');
    console.log('   🐦 Twitter: @yuvalav');
    console.log('   📸 Instagram: @yuval_770');
    
    console.log('\n🎉 Packaging completed successfully!');
    console.log('🚀 YUV.AI SocialBot Pro is ready to FLY HIGH!');
    console.log('='.repeat(50));
    
} catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
} 