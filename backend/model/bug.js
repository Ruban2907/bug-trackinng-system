const mongoose = require("mongoose");

const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['feature', 'bug'],
      lowercase: true,
    },
    status: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    screenshot: {
      data: { type: Buffer },
      contentType: { type: String }
    }
  },
  { timestamps: true }
);

bugSchema.index({ type: 1, status: 1 });
bugSchema.index({ title: 1 });

const Bug = mongoose.model("bug", bugSchema);
module.exports = Bug;
