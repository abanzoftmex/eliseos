/**
 * Simple test utility to verify logo loading
 * Run this in browser console to test logo accessibility
 */

export const testLogoAccess = async () => {
  const logoUrl = '/logo.webp';
  
  try {
    console.log('🔍 Testing logo accessibility...');
    
    // Test 1: Fetch the logo
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ Logo fetch successful');
    
    // Test 2: Load as image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        console.log('✅ Logo image loaded successfully');
        console.log(`📐 Dimensions: ${img.width}x${img.height}`);
        resolve({
          success: true,
          width: img.width,
          height: img.height,
          url: logoUrl
        });
      };
      
      img.onerror = (error) => {
        console.error('❌ Logo image failed to load:', error);
        reject(new Error('Failed to load logo image'));
      };
      
      img.src = logoUrl;
    });
    
  } catch (error) {
    console.error('❌ Logo test failed:', error.message);
    return {
      success: false,
      error: error.message,
      url: logoUrl
    };
  }
};

// Auto-run test if in browser environment
if (typeof window !== 'undefined') {
  console.log('🚀 Logo test utility loaded. Run testLogoAccess() to test logo.');
}