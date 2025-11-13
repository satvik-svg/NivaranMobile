// Script to create storage bucket programmatically
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  console.log('🔧 Creating storage bucket with admin client...');
  
  try {
    // Create the bucket
    const { data, error } = await supabaseAdmin.storage.createBucket('issue-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists!');
        return true;
      }
      console.error('❌ Error creating bucket:', error);
      return false;
    }

    console.log('✅ Bucket created successfully:', data);
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function testBucketAccess() {
  console.log('🧪 Testing bucket access...');
  
  try {
    // List buckets to verify
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return;
    }
    
    console.log('📂 Available buckets:', buckets.map(b => `${b.name} (public: ${b.public})`));
    
    const issueImagesBucket = buckets.find(b => b.name === 'issue-images');
    if (issueImagesBucket) {
      console.log('✅ issue-images bucket found!');
      console.log('📋 Bucket config:', {
        name: issueImagesBucket.name,
        public: issueImagesBucket.public,
        file_size_limit: issueImagesBucket.file_size_limit
      });
    } else {
      console.log('❌ issue-images bucket not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing bucket:', error);
  }
}

async function main() {
  console.log('🚀 Storage Bucket Setup');
  console.log('========================');
  
  // First test current state
  await testBucketAccess();
  
  console.log('\n🔧 Creating bucket...');
  const success = await createStorageBucket();
  
  if (success) {
    console.log('\n🧪 Testing after creation...');
    await testBucketAccess();
  }
}

main();