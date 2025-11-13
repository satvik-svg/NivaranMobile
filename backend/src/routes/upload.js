const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image endpoint
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    console.log('🔵 [UPLOAD] Image upload request received');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Storage service not available' });
    }

    // Generate unique filename
    const fileName = `issue_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    console.log('🔵 [UPLOAD] Uploading file:', fileName, 'Size:', req.file.size);

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('issue-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('🔵 [UPLOAD] Storage error:', error);
      return res.status(500).json({ error: 'Failed to upload image', details: error.message });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('issue-images')
      .getPublicUrl(data.path);

    console.log('🔵 [UPLOAD] Upload successful:', urlData.publicUrl);

    res.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      fileName: fileName
    });

  } catch (error) {
    console.error('🔵 [UPLOAD] Upload error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;