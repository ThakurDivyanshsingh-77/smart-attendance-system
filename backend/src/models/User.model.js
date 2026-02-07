const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // ✅ Email MUST be unique
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['teacher', 'student'],
      required: true
    },

    // Student-specific fields
    rollNumber: {
      type: String,
      // unique: true, ❌ REMOVED: Allows duplicate roll numbers (e.g. 72 in Year 1 and 72 in Year 2)
      required: function () {
        return this.role === 'student';
      }
    },
    year: {
      type: Number,
      enum: [1, 2, 3],
      required: function () {
        return this.role === 'student';
      }
    },
    semester: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
      required: function () {
        return this.role === 'student';
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
userSchema.index({ email: 1 });
// userSchema.index({ rollNumber: 1 }); // Optional: Removed index to prevent hidden unique constraints
userSchema.index({ role: 1, year: 1, semester: 1 });

// 🔐 Hash password before save
userSchema.pre('save', async function (next) { // Added 'next' parameter just in case, though async handles it
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 🧹 Remove password from JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);