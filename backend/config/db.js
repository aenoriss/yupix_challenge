import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const dbUri = process.env.MONGODB_URI;
    
    await mongoose.connect(dbUri);
    
    if (isProduction) {
      console.log('MongoDB Atlas connected (Production)');
    } else {
      console.log('MongoDB connected (Development)');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;