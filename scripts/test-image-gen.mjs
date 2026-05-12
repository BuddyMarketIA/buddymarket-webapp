import pg from 'pg';
const { Pool } = pg;

async function test() {
  const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
  const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
  console.log('API URL available:', !!FORGE_API_URL);
  console.log('API KEY available:', !!FORGE_API_KEY);
  
  if (!FORGE_API_URL || !FORGE_API_KEY) {
    console.log('Missing env vars - cannot proceed');
    process.exit(1);
  }
  
  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : FORGE_API_URL + '/';
  const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
  console.log('Calling image generation API...');
  
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      'authorization': 'Bearer ' + FORGE_API_KEY,
    },
    body: JSON.stringify({
      prompt: 'Professional food photography of Spanish tortilla de patatas, golden brown omelette with potatoes, served on a white plate, 45-degree angle, restaurant quality, natural lighting',
      original_images: [],
    }),
  });
  
  console.log('Status:', response.status);
  if (response.ok) {
    const result = await response.json();
    console.log('SUCCESS - Got image data, length:', result.image?.b64Json?.length || 0);
    console.log('Mime type:', result.image?.mimeType);
    
    // Now test storage upload
    const storageUrl = new URL('storage.v1.StorageService/PutObject', baseUrl).toString();
    const buffer = Buffer.from(result.image.b64Json, 'base64');
    
    const storageResp = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'connect-protocol-version': '1',
        'authorization': 'Bearer ' + FORGE_API_KEY,
      },
      body: JSON.stringify({
        key: `recipe-images/test-tortilla-${Date.now()}.png`,
        body: result.image.b64Json,
        content_type: result.image.mimeType || 'image/png',
      }),
    });
    
    console.log('Storage status:', storageResp.status);
    if (storageResp.ok) {
      const storageResult = await storageResp.json();
      console.log('Uploaded to:', storageResult.url);
    } else {
      const errText = await storageResp.text();
      console.log('Storage error:', errText.substring(0, 200));
    }
  } else {
    const text = await response.text();
    console.log('Error:', text.substring(0, 300));
  }
}

test().catch(e => console.error('Fatal:', e.message));
