const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    picture: {
      data: Buffer,
      contentType: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    qaAssigned: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    }],
    developersAssigned: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    }],
  },
  { timestamps: true }
);

const Project = mongoose.model("project", projectSchema);
module.exports = Project;
