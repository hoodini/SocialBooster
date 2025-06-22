const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSizes = [16, 48, 128];
const svgPath = path.join(__dirname, '..', 'icons', 'logo.svg');
const iconsDir = path.join(__dirname, '..', 'icons');

async function generateIcons() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate icons for each size
    for (const size of iconSizes) {
      const outputPath = path.join(iconsDir, `icon${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated icon${size}.png`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 