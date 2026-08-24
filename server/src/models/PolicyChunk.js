const mongoose = require("mongoose");

// Mirrors chunk metadata stored by the AI service's FAISS index, cached here
// so the Node API/UI can display policy structure without round-tripping to
// Python for simple reads.
const PolicyChunkSchema = new mongoose.Schema(
  {
    policyId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    section: { type: String },
    page: { type: Number },
    text: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PolicyChunk", PolicyChunkSchema);
