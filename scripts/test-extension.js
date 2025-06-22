#!/usr/bin/env node

// YUV.AI SocialBot Pro - Extension Tester
const fs = require('fs');
const path = require('path');

console.log('🧪 Running extension tests...');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
    totalTests++;
    console.log(`\n🔬 Testing: ${testName}`);
    
    try {
        const result = testFn();
        if (result) {
            console.log(`✅ PASS: ${testName}`);
            passedTests++;
        } else {
            console.log(`❌ FAIL: ${testName}`);
            failedTests++;
        }
    } catch (error) {
        console.log(`❌ ERROR: ${testName} - ${error.message}`);
        failedTests++;
    }
}

// Test 1: Check if all core files exist
runTest('Core files existence', () => {
    const coreFiles = [
        'manifest.json',
        'popup.html',
        'popup.js',
        'popup.css', 
        'content.js',
        'content.css',
        'background.js'
    ];
    
    const missingFiles = coreFiles.filter(file => {
        const filePath = path.join(__dirname, '..', file);
        return !fs.existsSync(filePath);
    });
    
    if (missingFiles.length > 0) {
        console.log(`   Missing files: ${missingFiles.join(', ')}`);
        return false;
    }
    
    console.log(`   All ${coreFiles.length} core files present`);
    return true;
});

// Test 2: Check manifest.json structure
runTest('Manifest structure validation', () => {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = [
        'manifest_version',
        'name', 
        'version',
        'description',
        'permissions',
        'host_permissions',
        'content_scripts',
        'background',
        'action'
    ];
    
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
        console.log(`   Missing fields: ${missingFields.join(', ')}`);
        return false;
    }
    
    if (manifest.manifest_version !== 3) {
        console.log(`   Wrong manifest version: ${manifest.manifest_version}, expected 3`);
        return false;
    }
    
    console.log(`   Manifest structure is valid (v${manifest.version})`);
    return true;
});

// Test 3: Check YUV.AI branding
runTest('YUV.AI branding verification', () => {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (!manifest.name.includes('YUV.AI')) {
        console.log(`   Extension name missing YUV.AI branding: ${manifest.name}`);
        return false;
    }
    
    if (!manifest.description.includes('YUV.AI')) {
        console.log(`   Description missing YUV.AI branding`);
        return false;
    }
    
    console.log(`   YUV.AI branding properly included`);
    return true;
});

// Test 4: Check Cohere API integration
runTest('Cohere API integration check', () => {
    const backgroundPath = path.join(__dirname, '..', 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    const cohereApiUrl = 'api.cohere.com';
    const cohereModel = 'command-a-03-2025';
    
    if (!backgroundContent.includes(cohereApiUrl)) {
        console.log(`   Cohere API URL not found`);
        return false;
    }
    
    if (!backgroundContent.includes(cohereModel)) {
        console.log(`   Cohere model not found`);
        return false;
    }
    
    if (!backgroundContent.includes('stream: true')) {
        console.log(`   Streaming not enabled`);
        return false;
    }
    
    console.log(`   Cohere API integration verified`);
    return true;
});

// Test 5: Check content script functionality
runTest('Content script functionality', () => {
    const contentPath = path.join(__dirname, '..', 'content.js');
    const contentContent = fs.readFileSync(contentPath, 'utf8');
    
    const requiredFunctions = [
        'detectPlatform',
        'handleScroll',
        'processAutoLike',
        'processAutoComment',
        'generateAndPostComment'
    ];
    
    const missingFunctions = requiredFunctions.filter(func => 
        !contentContent.includes(func)
    );
    
    if (missingFunctions.length > 0) {
        console.log(`   Missing functions: ${missingFunctions.join(', ')}`);
        return false;
    }
    
    // Check platform support
    if (!contentContent.includes('linkedin.com') || !contentContent.includes('facebook.com')) {
        console.log(`   Platform support incomplete`);
        return false;
    }
    
    console.log(`   Content script functionality verified`);
    return true;
});

// Test 6: Check popup interface
runTest('Popup interface validation', () => {
    const popupHtmlPath = path.join(__dirname, '..', 'popup.html');
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
    
    const requiredElements = [
        'apiKey',
        'personaSelect',
        'autoLikes',
        'autoComments',
        'linkedinEnabled',
        'facebookEnabled'
    ];
    
    const missingElements = requiredElements.filter(element => 
        !popupHtml.includes(`id="${element}"`)
    );
    
    if (missingElements.length > 0) {
        console.log(`   Missing UI elements: ${missingElements.join(', ')}`);
        return false;
    }
    
    if (!popupHtml.includes('YUV.AI')) {
        console.log(`   YUV.AI branding missing from popup`);
        return false;
    }
    
    console.log(`   Popup interface validated`);
    return true;
});

// Test 7: Check icons
runTest('Icons validation', () => {
    const iconSizes = [16, 48, 128];
    const missingIcons = iconSizes.filter(size => {
        const iconPath = path.join(__dirname, '..', 'icons', `icon${size}.png`);
        return !fs.existsSync(iconPath);
    });
    
    if (missingIcons.length > 0) {
        console.log(`   Missing icon sizes: ${missingIcons.join(', ')}`);
        return false;
    }
    
    console.log(`   All icon sizes present (${iconSizes.join(', ')})`);
    return true;
});

// Test 8: Check persona management
runTest('Persona management functionality', () => {
    const popupJsPath = path.join(__dirname, '..', 'popup.js');
    const popupJs = fs.readFileSync(popupJsPath, 'utf8');
    
    const requiredPersonaFunctions = [
        'showPersonaForm',
        'savePersona',
        'editSelectedPersona',
        'deleteSelectedPersona',
        'populatePersonaSelect'
    ];
    
    const missingFunctions = requiredPersonaFunctions.filter(func => 
        !popupJs.includes(func)
    );
    
    if (missingFunctions.length > 0) {
        console.log(`   Missing persona functions: ${missingFunctions.join(', ')}`);
        return false;
    }
    
    console.log(`   Persona management functionality verified`);
    return true;
});

// Test 9: Check error handling
runTest('Error handling validation', () => {
    const files = ['popup.js', 'content.js', 'background.js'];
    let totalTryBlocks = 0;
    let totalCatchBlocks = 0;
    
    files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const tryBlocks = (content.match(/try\s*{/g) || []).length;
        const catchBlocks = (content.match(/}\s*catch\s*\(/g) || []).length;
        
        totalTryBlocks += tryBlocks;
        totalCatchBlocks += catchBlocks;
    });
    
    if (totalTryBlocks === 0) {
        console.log(`   No error handling found`);
        return false;
    }
    
    if (totalTryBlocks !== totalCatchBlocks) {
        console.log(`   Mismatched try/catch blocks: ${totalTryBlocks} try, ${totalCatchBlocks} catch`);
        return false;
    }
    
    console.log(`   Error handling properly implemented (${totalTryBlocks} try/catch blocks)`);
    return true;
});

// Test 10: Check social links
runTest('Social links verification', () => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    const readme = fs.readFileSync(readmePath, 'utf8');
    
    const requiredLinks = [
        'linktr.ee/yuvai',
        '@yuvalav',
        '@yuval_770',
        'yuval-avidani'
    ];
    
    const missingLinks = requiredLinks.filter(link => !readme.includes(link));
    
    if (missingLinks.length > 0) {
        console.log(`   Missing social links: ${missingLinks.join(', ')}`);
        return false;
    }
    
    console.log(`   All social links present`);
    return true;
});

// Test Summary
console.log('\n' + '='.repeat(60));
console.log('🧪 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`📊 Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (failedTests > 0) {
    console.log('\n❌ Some tests failed! Please fix issues before proceeding.');
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed!');
    console.log('🚀 YUV.AI SocialBot Pro is ready to FLY HIGH!');
}

console.log('='.repeat(60)); 