import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    displayName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    language: {
      type: String,
      default: "English",
    },
    carPreferences: {
      make: {
        type: String,
        default: null,
      },
      model: {
        type: String,
        default: null,
      },
      type: {
        type: String,
        default: null,
      },
      steering: {
        type: String,
        default: null,
      },
      year: {
        type: Number,
        default: null,
      },
      priceRange: {
        type: String,
        default: null,
      },
      mileage: {
        type: String,
        default: null,
      },
      location: {
        type: String,
        default: null,
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (!this.googleId || this.googleId === null) {
    delete this.googleId;
  }
  next();
});
// userSchema.pre("validate", function (next) {
//   if (!this.googleId) {
//     this.googleId = undefined; // This prevents MongoDB from storing `null`
//   }
//   next();
// });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!candidatePassword || !this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("User", userSchema);

export default User;
