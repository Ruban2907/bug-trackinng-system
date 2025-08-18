const mongoose = require("mongoose");
const Bug = require("./bug");

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


projectSchema.pre("findOneAndDelete", async function (next) {
  try {
    const filter = typeof this.getFilter === "function" ? this.getFilter() : this.getQuery();
    const projectId = filter && (filter._id || filter.id);
    if (projectId) {
      await Bug.deleteMany({ projectId });
    }
    next();
  } catch (error) {
    next(error);
  }
});


projectSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
  try {
    const filter = typeof this.getFilter === "function" ? this.getFilter() : this.getQuery();
    const projectId = filter && (filter._id || filter.id);
    if (projectId) {
      await Bug.deleteMany({ projectId });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Project = mongoose.model("project", projectSchema);
module.exports = Project;
