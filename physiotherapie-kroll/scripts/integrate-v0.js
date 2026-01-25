#!/usr/bin/env node

/**
 * Helper script to integrate V0 components into the project
 * 
 * Usage:
 *   node scripts/integrate-v0.js [component-name] [path-to-v0-code]
 * 
 * Example:
 *   node scripts/integrate-v0.js HeroSection ./v0-code/hero-section.tsx
 */

const fs = require('fs')
const path = require('path')

const [componentName, sourcePath] = process.argv.slice(2)

if (!componentName || !sourcePath) {
  console.error('Usage: node scripts/integrate-v0.js [component-name] [path-to-v0-code]')
  console.error('Example: node scripts/integrate-v0.js HeroSection ./v0-code/hero-section.tsx')
  process.exit(1)
}

const targetDir = path.join(__dirname, '../src/components/v0')
const targetFile = path.join(targetDir, `${componentName}.tsx`)

// Create v0 directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
  console.log(`✓ Created directory: ${targetDir}`)
}

// Read source file
if (!fs.existsSync(sourcePath)) {
  console.error(`✗ Source file not found: ${sourcePath}`)
  process.exit(1)
}

let content = fs.readFileSync(sourcePath, 'utf8')

// Transform imports to use project aliases
content = content.replace(/from ['"]@\//g, 'from "@/')
content = content.replace(/from ['"]\.\.\/\.\.\/components/g, 'from "@/components')
content = content.replace(/from ['"]\.\.\/components/g, 'from "@/components')

// Add "use client" if not present and component uses hooks
if (content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) {
  if (!content.includes('"use client"')) {
    content = '"use client"\n\n' + content
  }
}

// Write to target
fs.writeFileSync(targetFile, content, 'utf8')
console.log(`✓ Integrated V0 component: ${targetFile}`)
  
Next steps:
1. Review the component and adjust imports if needed
2. Add the component to your CMS block types if needed
3. Test the component in your application`)
