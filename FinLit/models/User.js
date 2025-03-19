import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ActivitySchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'game', 'course', etc.
  title: { type: String, required: true }, // Name of the game or course
  action: { type: String, required: true }, // 'started', 'completed', 'played', etc.
  timestamp: { type: Date, default: Date.now }
});

const CourseProgressSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  progress: { type: Number, default: 0 }, // 0-100 percentage
  lastAccessed: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
});

const GameProgressSchema = new mongoose.Schema({
  gameId: { type: String, required: true },
  title: { type: String, required: true },
  highScore: { type: Number, default: 0 },
  timesPlayed: { type: Number, default: 0 },
  lastPlayed: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" }, // Store image URL
  preferences: {
    theme: { type: String, default: "light" },
    notifications: { type: Boolean, default: true },
  },
  courseProgress: [CourseProgressSchema],
  gameProgress: [GameProgressSchema],
  recentActivity: [ActivitySchema],
  totalCoursesCompleted: { type: Number, default: 0 },
  overallProgress: { type: Number, default: 0 } // Overall learning progress percentage
}, { timestamps: true });

// Hash password before saving
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", UserSchema);