const pool = require('../services/pg_db');
const crypto = require('crypto');

async function seed() {
  try {
    console.log('🧹 Clearing old dummy data...');
    await pool.query('DELETE FROM users WHERE email LIKE "%@example.com"');
    
    console.log('🌱 Seeding 20 dummy profiles in Trivandrum...');

    const users = [
      { name: 'Sarah Wilson', gender: 'Female', bio: 'Adventure seeker and coffee lover. Let\'s hike!' },
      { name: 'James Chen', gender: 'Male', bio: 'Tech enthusiast. I love gaming and pizza.' },
      { name: 'Emma Davis', gender: 'Female', bio: 'Photography is my passion. 📸' },
      { name: 'Michael Brown', gender: 'Male', bio: 'Gym rat. Fitness is life.' },
      { name: 'Olivia Smith', gender: 'Female', bio: 'Travel blogger. Currently in New York.' },
      { name: 'Liam Johnson', gender: 'Male', bio: 'Music producer. Let\'s jam.' },
      { name: 'Sophia Garcia', gender: 'Female', bio: 'Cooking is therapeutic for me. Join for dinner?' },
      { name: 'Noah Miller', gender: 'Male', bio: 'Movie buff. Ask me about any film.' },
      { name: 'Isabella Martinez', gender: 'Female', bio: 'Nature lover. 🌿' },
      { name: 'Mason Hernandez', gender: 'Male', bio: 'Coding by day, gaming by night.' },
      { name: 'Ava Lopez', gender: 'Female', bio: 'Fashion and art enthusiast.' },
      { name: 'Ethan Gonzalez', gender: 'Male', bio: 'Hiker and amateur chef.' },
      { name: 'Mia Rodriquez', gender: 'Female', bio: 'Digital nomad. Exploring the world.' },
      { name: 'Lucas Perez', gender: 'Male', bio: 'Jazz lover. Saxophone player.' },
      { name: 'Charlotte Taylor', gender: 'Female', bio: 'Bookworm and tea drinker.' },
      { name: 'Jack Anderson', gender: 'Male', bio: 'Surfer and ocean lover.' },
      { name: 'Amelia Thomas', gender: 'Female', bio: 'Yoga instructor.' },
      { name: 'Benjamin Moore', gender: 'Male', bio: 'Biker. Life is a journey.' },
      { name: 'Harper Jackson', gender: 'Female', bio: 'Vintage soul. 🎞️' },
      { name: 'William White', gender: 'Male', bio: 'Sustainability advocate.' }
    ];

    // Base coordinates (Trivandrum, Kerala area for testing)
    const baseLat = 8.5241;
    const baseLon = 76.9366;

    for (let i = 0; i < users.length; i++) {
      const id = crypto.randomUUID();
      const email = `user${i + 1}@example.com`;

      // Randomize location slightly (within ~10 miles)
      const lat = baseLat + (Math.random() - 0.5) * 0.1;
      const lon = baseLon + (Math.random() - 0.5) * 0.1;

      // Insert User
      await pool.query(
        'INSERT INTO users (id, email, name, password_hash, gender, bio, latitude, longitude, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, email, users[i].name, 'DUMMY_PWD', users[i].gender, users[i].bio, lat, lon, 'active']
      );

      // Randomly assign 2-4 interests
      const interestCount = Math.floor(Math.random() * 3) + 2;
      const shuffeledInterests = [1, 2, 3, 4, 5, 6, 7, 8].sort(() => 0.5 - Math.random());
      const selectedInterests = shuffeledInterests.slice(0, interestCount);

      for (const interestId of selectedInterests) {
        await pool.query(
          'INSERT IGNORE INTO user_interests (user_id, interest_id) VALUES ($1, $2)',
          [id, interestId]
        );
      }
    }

    console.log('✅ Successfully added 20 dummy profiles!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed();
