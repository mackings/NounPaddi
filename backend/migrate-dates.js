const mongoose = require('mongoose');
require('dotenv').config();

const Material = require('./models/Material');

async function migrateDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all materials
    const materials = await Material.find({});
    console.log(`Found ${materials.length} materials to update`);

    // Update each material
    for (const material of materials) {
      // Use uploadDate if it exists, otherwise use current date
      const dateToUse = material.uploadDate || new Date();

      await Material.updateOne(
        { _id: material._id },
        {
          $set: {
            createdAt: dateToUse,
            updatedAt: dateToUse
          }
        }
      );
    }

    console.log(`✅ Successfully migrated ${materials.length} materials`);
    console.log('All materials now have createdAt and updatedAt timestamps');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrateDates();
