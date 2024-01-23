import mongoose from 'mongoose';
import config from '../config/server.config.js';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUrl, {});
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export { connectDB };