import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    
    // eslint-disable-next-line no-undef
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // eslint-disable-next-line no-undef
    process.exit(1); // Exit on failure
  }
};

export default connectDB;
