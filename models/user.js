const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (validator.contains(value.toLowerCase(), "password")) {
        throw { error: "Wrong format of Password" };
      }
    },
  },
  role: {
    type: String,
    required: true,
  },
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  companyID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  blockReason: {
    type: String,
  },
  token: {
    type: String,
  },
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
