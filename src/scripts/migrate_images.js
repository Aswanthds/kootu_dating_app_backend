const pool = require('../services/db');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios'); // We use this to download the image
require('dotenv').config();

// Initialize AWS Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function migrate() {
  try {
    console.log('🔗 Connecting to MySQL to find Firebase images...');

    // 1. Find all photos that still have a "firebase" link
    const [photos] = await pool.query('SELECT id, photo_url FROM user_photos WHERE photo_url LIKE "%firebase%"');

    console.log(`📸 Found ${photos.length} images to migrate.`);

    for (const photo of photos) {
      console.log(`🚀 Migrating: ${photo.id}...`);

      // 2. Download from Firebase
      const response = await axios.get(photo.photo_url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'utf-8');

      // 3. Define the new S3 Key (Filename)
      const fileName = `profile_photos/${photo.id}.jpg`;

      // 4. Upload to S3
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/jpeg'
      }));

      const newUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      // 5. UPDATE MYSQL: Your turn!
      // ??? WHAT IS THE UPDATE QUERY TO SWAP THE OLD URL WITH THE NEW ONE ???
      await pool.query('UPDATE user_photos SET photo_url = ? WHERE id = ?', [newUrl, photo.id]);

      console.log(`✅ Success for ${photo.id}`);
    }

    console.log('🏁 Migration Complete!');
    process.exit();
  } catch (error) {
    console.error('❌ Migration Failed:', error);
    process.exit(1);
  }
}

migrate();
