#!/usr/bin/env node

/**
 * LayerEdge Mobile Responsiveness Audit Script
 * Tests all pages across multiple mobile viewports
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Mobile viewport configurations
const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 12', width: 375, height: 812 },
  { name: 'iPhone 12 Pro Max', width: 414, height: 896 },
  { name: 'iPad Mini', width: 768, height: 1024 },
];

// Pages to test
const PAGES_TO_TEST = [
  { name: 'Homepage', url: '/' },
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Leaderboard', url: '/leaderboard' },
  { name: 'Recent Activity', url: '/recent' },
  { name: 'Submit Tweet', url: '/submit-tweet' },
  { name: 'FAQ', url: '/faq' },
  { name: 'Terms', url: '/terms' },
  { name: 'Privacy', url: '/privacy' },
  { name: 'Cookie Policy', url: '/cookie-policy' },
  { name: 'Helper', url: '/helper' },
];

// Test criteria
const MOBILE_TESTS = {
  touchTargets: {
    name: 'Touch Target Size',
    description: 'Buttons and interactive elements should be at least 44px',
    test: async (page) => {
      const smallTargets = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, a, input, [role="button"], [tabindex]');
        const small = [];
        
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            small.push({
              tag: el.tagName,
              class: el.className,
              width: rect.width,
              height: rect.height
            });
          }
        });
        
        return small;
      });
      
      return {
        passed: smallTargets.length === 0,
        details: smallTargets.length > 0 ? `Found ${smallTargets.length} elements smaller than 44px` : 'All touch targets are appropriately sized'
      };
    }
  },
  
  horizontalScroll: {
    name: 'No Horizontal Scroll',
    description: 'Content should not require horizontal scrolling',
    test: async (page) => {
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      return {
        passed: !hasHorizontalScroll,
        details: hasHorizontalScroll ? 'Page has horizontal scroll' : 'No horizontal scroll detected'
      };
    }
  },
  
  textReadability: {
    name: 'Text Readability',
    description: 'Text should be readable without zooming',
    test: async (page) => {
      const smallText = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        const small = [];
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          
          if (fontSize > 0 && fontSize < 14 && el.textContent.trim().length > 0) {
            small.push({
              tag: el.tagName,
              fontSize: fontSize,
              text: el.textContent.trim().substring(0, 50)
            });
          }
        });
        
        return small;
      });
      
      return {
        passed: smallText.length === 0,
        details: smallText.length > 0 ? `Found ${smallText.length} text elements smaller than 14px` : 'All text is appropriately sized'
      };
    }
  },
  
  responsiveImages: {
    name: 'Responsive Images',
    description: 'Images should scale appropriately',
    test: async (page) => {
      const overflowingImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        const overflowing = [];
        
        images.forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.width > window.innerWidth) {
            overflowing.push({
              src: img.src,
              width: rect.width,
              viewportWidth: window.innerWidth
            });
          }
        });
        
        return overflowing;
      });
      
      return {
        passed: overflowingImages.length === 0,
        details: overflowingImages.length > 0 ? `Found ${overflowingImages.length} images overflowing viewport` : 'All images scale appropriately'
      };
    }
  },
  
  navigation: {
    name: 'Mobile Navigation',
    description: 'Navigation should be accessible on mobile',
    test: async (page) => {
      const hasNavigation = await page.evaluate(() => {
        // Check for mobile menu button or navigation
        const mobileMenu = document.querySelector('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"], button[aria-label*="Menu"]');
        const navigation = document.querySelector('nav, [role="navigation"]');
        
        return {
          hasMobileMenu: !!mobileMenu,
          hasNavigation: !!navigation
        };
      });
      
      return {
        passed: hasNavigation.hasMobileMenu || hasNavigation.hasNavigation,
        details: hasNavigation.hasMobileMenu ? 'Mobile menu found' : hasNavigation.hasNavigation ? 'Navigation found' : 'No mobile navigation detected'
      };
    }
  }
};

async function runMobileAudit() {
  console.log('🚀 Starting LayerEdge Mobile Responsiveness Audit...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    },
    pages: {}
  };
  
  try {
    for (const viewport of MOBILE_VIEWPORTS) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      for (const pageConfig of PAGES_TO_TEST) {
        console.log(`  📄 Testing ${pageConfig.name}...`);
        
        const page = await browser.newPage();
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 2
        });
        
        try {
          await page.goto(`http://localhost:3000${pageConfig.url}`, {
            waitUntil: 'networkidle0',
            timeout: 30000
          });
          
          // Wait for any animations or dynamic content
          await page.waitForTimeout(2000);
          
          const pageKey = `${pageConfig.name}_${viewport.name}`;
          results.pages[pageKey] = {
            page: pageConfig.name,
            viewport: viewport.name,
            url: pageConfig.url,
            tests: {}
          };
          
          // Run all mobile tests
          for (const [testKey, testConfig] of Object.entries(MOBILE_TESTS)) {
            try {
              const testResult = await testConfig.test(page);
              results.pages[pageKey].tests[testKey] = {
                name: testConfig.name,
                description: testConfig.description,
                passed: testResult.passed,
                details: testResult.details
              };
              
              results.summary.totalTests++;
              if (testResult.passed) {
                results.summary.passedTests++;
              } else {
                results.summary.failedTests++;
                console.log(`    ❌ ${testConfig.name}: ${testResult.details}`);
              }
            } catch (error) {
              console.log(`    ⚠️  ${testConfig.name}: Test failed - ${error.message}`);
              results.pages[pageKey].tests[testKey] = {
                name: testConfig.name,
                description: testConfig.description,
                passed: false,
                details: `Test error: ${error.message}`
              };
              results.summary.totalTests++;
              results.summary.failedTests++;
            }
          }
          
        } catch (error) {
          console.log(`    ❌ Failed to load page: ${error.message}`);
          results.pages[`${pageConfig.name}_${viewport.name}`] = {
            page: pageConfig.name,
            viewport: viewport.name,
            url: pageConfig.url,
            error: error.message,
            tests: {}
          };
        }
        
        await page.close();
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
  
  // Generate report
  const reportPath = path.join(__dirname, '..', 'mobile-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('📊 Mobile Audit Summary:');
  console.log(`   Total Tests: ${results.summary.totalTests}`);
  console.log(`   Passed: ${results.summary.passedTests} ✅`);
  console.log(`   Failed: ${results.summary.failedTests} ❌`);
  console.log(`   Success Rate: ${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%`);
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return results;
}

// Run the audit if this script is executed directly
if (require.main === module) {
  runMobileAudit().catch(console.error);
}

module.exports = { runMobileAudit, MOBILE_VIEWPORTS, PAGES_TO_TEST, MOBILE_TESTS };
