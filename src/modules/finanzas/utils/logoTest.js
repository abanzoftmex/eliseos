/**
 * Test script to verify logo accessibility
 */
export const testLogoAvailability = async () => {
  const logoUrls = [
    '/logo.webp',
    '/logo.png', 
    '/logo.jpg',
    '/logo.jpeg',
    '/logo-santi.png',
    '/logo-santi.jpg'
  ];

  console.log('🔍 Testing logo availability...');
  
  for (const logoUrl of logoUrls) {
    try {
      const response = await fetch(logoUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Logo accesible: ${logoUrl} - Status: ${response.status}`);
      } else {
        console.log(`❌ Logo no accesible: ${logoUrl} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error accediendo a logo: ${logoUrl} - ${error.message}`);
    }
  }
};
