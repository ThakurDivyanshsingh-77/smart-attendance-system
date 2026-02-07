require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Subject = require('../src/models/Subject.model');

const subjects = [
  {
    name: 'Data Analytics Using Python',
    code: 'BCA601',
    year: 3,
    semester: 6
  },
  {
    name: 'Fundamentals of Full Stack Web Development',
    code: 'BCA602',
    year: 3,
    semester: 6
  },
  {
    name: 'E-Commerce and Cyber Security',
    code: 'BCA603',
    year: 3,
    semester: 6
  }
];

async function seedSubjects() {
  try {
    console.log('🔍 MONGODB_URI =', process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }

    // 🔗 Connect DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // 🔁 Insert or Update (NO DELETE, NO DUPLICATE)
    for (const subject of subjects) {
      const result = await Subject.findOneAndUpdate(
        { code: subject.code },     // unique identifier
        { $set: subject },
        { upsert: true, new: true }
      );

      console.log(`✅ Subject seeded: ${result.code}`);
    }

    console.log('🎉 Subject seeding completed successfully');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
    process.exit(1);
  }
}

seedSubjects();
