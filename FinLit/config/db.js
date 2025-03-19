import { connect } from './sqlite-adapter.js';

const connectDB = async () => {
  try {
    console.log("Connecting to SQLite database...");
    const db = await connect();
    console.log(`SQLite Database Connected`);
    return db;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // eslint-disable-next-line no-undef
    process.exit(1); // Exit on failure
  }
};

export default connectDB;