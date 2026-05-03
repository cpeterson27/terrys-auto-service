import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User';

dotenv.config();

const ADMIN_EMAIL = 'terry.tucker63@yahoo.com';
const ADMIN_NAME = 'Terry Tucker';

const main = async () => {
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 6) {
    throw new Error('Set ADMIN_PASSWORD to Terrys app login password before running this script');
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/terry-auto-service');

  const existingAdmin = await User.findOne({ role: 'admin', email: { $ne: ADMIN_EMAIL } });

  if (existingAdmin) {
    throw new Error(`Refusing to create another admin while ${existingAdmin.email} is already admin`);
  }

  const user = await User.findOne({ email: ADMIN_EMAIL });

  if (user) {
    user.name = user.name || ADMIN_NAME;
    user.password = password;
    user.role = 'admin';
    await user.save();
  } else {
    await User.create({
      email: ADMIN_EMAIL,
      password,
      name: ADMIN_NAME,
      role: 'admin',
    });
  }

  const admins = await User.find({ role: 'admin' }).select('email role name');

  console.log(`Admin ready: ${ADMIN_EMAIL}`);
  console.log(`Admin count: ${admins.length}`);
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
