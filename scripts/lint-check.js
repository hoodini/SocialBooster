#!/usr/bin/env node

// YUV.AI SocialBot Pro - Lint Checker
const fs = require('fs');
const path = require('path');

console.log('🔍 Running lint checks...');

const jsFiles = [
    'popup.js',
    'content.js', 
    'background.js'
];

let totalErrors = 0;
let totalWarnings = 0;

jsFiles.forEach(file => {
    console.log(`\n📄 Checking ${file}...`);
    
    try {
        const filePath = path.join(__dirname, '..', file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        let errors = 0;
        let warnings = 0;
        
        // Check for console.log statements (warnings)
        const consoleLogs = (content.match(/console\.log/g) || []).length;
        if (consoleLogs > 0) {
            console.log(`⚠️  Found ${consoleLogs} console.log statements (consider removing for production)`);
            warnings += consoleLogs;
        }
        
        // Check for TODO comments
        const todos = (content.match(/\/\/\s*TODO/gi) || []).length;
        if (todos > 0) {
            console.log(`📝 Found ${todos} TODO comments`);
        }
        
        // Check for YUV.AI branding in comments
        if (!content.includes('YUV.AI')) {
            console.log(`⚠️  YUV.AI branding not found in file comments`);
            warnings++;
        }
        
        // Check for proper async/await usage
        const asyncFunctions = (content.match(/async\s+function|async\s+\(/g) || []).length;
        const awaitUsage = (content.match(/await\s+/g) || []).length;
        
        if (asyncFunctions > 0) {
            console.log(`✅ Found ${asyncFunctions} async functions with ${awaitUsage} await calls`);
        }
        
        // Check for proper error handling
        const tryBlocks = (content.match(/try\s*{/g) || []).length;
        const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
        
        if (tryBlocks !== catchBlocks) {
            console.log(`❌ Mismatched try/catch blocks: ${tryBlocks} try, ${catchBlocks} catch`);
            errors++;
        }
        
        // Check for Chrome extension API usage
        const chromeApiCalls = (content.match(/chrome\.\w+/g) || []).length;
        if (chromeApiCalls > 0) {
            console.log(`🔌 Found ${chromeApiCalls} Chrome API calls`);
        }
        
        // Check for Cohere API integration
        if (content.includes('cohere.com') || content.includes('command-a-03-2025')) {
            console.log(`🤖 Cohere AI integration detected`);
        }
        
        // Summary for this file
        if (errors === 0 && warnings === 0) {
            console.log(`✅ ${file} looks good!`);
        } else {
            console.log(`📊 ${file}: ${errors} errors, ${warnings} warnings`);
        }
        
        totalErrors += errors;
        totalWarnings += warnings;
        
    } catch (error) {
        console.error(`❌ Error reading ${file}:`, error.message);
        totalErrors++;
    }
});

// CSS files check
console.log(`\n📄 Checking CSS files...`);
const cssFiles = ['popup.css', 'content.css'];

cssFiles.forEach(file => {
    try {
        const filePath = path.join(__dirname, '..', file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for YUV.AI branding
        if (content.includes('YUV.AI') || content.includes('667eea') || content.includes('764ba2')) {
            console.log(`✅ ${file} includes YUV.AI styling`);
        }
        
        // Check for responsive design
        if (content.includes('@media')) {
            console.log(`📱 ${file} includes responsive design`);
        }
        
    } catch (error) {
        console.error(`❌ Error reading ${file}:`, error.message);
        totalErrors++;
    }
});

// Final summary
console.log('\n' + '='.repeat(50));
console.log('📊 LINT SUMMARY');
console.log('='.repeat(50));
console.log(`❌ Total Errors: ${totalErrors}`);
console.log(`⚠️  Total Warnings: ${totalWarnings}`);

if (totalErrors > 0) {
    console.log('\n❌ Lint check failed! Please fix errors before proceeding.');
    process.exit(1);
} else if (totalWarnings > 0) {
    console.log('\n⚠️  Lint check passed with warnings. Consider addressing them.');
} else {
    console.log('\n✅ All lint checks passed!');
}

console.log('\n🚀 FLY HIGH WITH YUV.AI');
console.log('='.repeat(50)); 