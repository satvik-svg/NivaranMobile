// Test script to check Supabase Storage bucket
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hgxfyfbrwtozynuyqccr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneGZ5ZmJyd3RvenludXlxY2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDU2MjQsImV4cCI6MjA3MjMyMTYyNH0.vMaEiGcM2XNiv1fIGBsl7B3kyEdarsEvyuXXRyK1UsM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageBucket() {
  console.log('🔍 Testing Supabase Storage...');
  console.log('🔍 URL:', supabaseUrl);
  
  try {
    // Test 1: Check storage.buckets table directly
    console.log('\n🗄️ Checking storage.buckets table...');
    const { data: bucketsFromDB, error: dbError } = await supabase
      .from('storage.buckets')
      .select('*');
    
    if (dbError) {
      console.log('❌ Cannot query storage.buckets directly:', dbError.message);
    } else {
      console.log('✅ Buckets in database:', bucketsFromDB);
    }
    
    // Test 2: List all buckets via API
    console.log('\n📂 Listing all buckets via API...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      console.log('🔍 Full error details:', JSON.stringify(bucketsError, null, 2));
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name));
      console.log('📋 Full bucket details:', buckets);
    }
    
    // Test 3: Try to access issue-images bucket specifically
    console.log('\n📁 Testing issue-images bucket access...');
    const { data: files, error: filesError } = await supabase.storage
      .from('issue-images')
      .list('', { limit: 1 });
    
    if (filesError) {
      console.error('❌ Error accessing issue-images bucket:', filesError);
      console.log('🔍 Full error details:', JSON.stringify(filesError, null, 2));
    } else {
      console.log('✅ issue-images bucket is accessible!');
      console.log('📁 Files in bucket:', files.length);
    }
    
    // Test 4: Try to get public URL
    console.log('\n🔗 Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('issue-images')
      .getPublicUrl('test-file.jpg');
    
    console.log('✅ Public URL format:', urlData.publicUrl);
    
    // Test 5: Try an image upload test
    console.log('\n📤 Testing image upload capability...');
    // Create a minimal JPEG header (fake image data for testing)
    const fakeJpegData = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
    ]);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('issue-images')
      .upload('test-upload.jpg', fakeJpegData, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      console.log('🔍 Full upload error:', JSON.stringify(uploadError, null, 2));
    } else {
      console.log('✅ Upload test successful!');
      console.log('📤 Upload result:', uploadData);
      
      // Clean up test file
      await supabase.storage
        .from('issue-images')
        .remove(['test-upload.jpg']);
      console.log('🧹 Test file cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testStorageBucket();