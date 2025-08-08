const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'qa' , 'developer'],
      default: 'manager',
    },
    picture: {
      data: { type: Buffer },
      contentType: { type: String }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);
module.exports = User;