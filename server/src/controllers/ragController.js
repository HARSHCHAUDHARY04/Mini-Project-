const asyncHandler = require("../utils/asyncHandler");
const ai = require("../services/aiServiceClient");

const searchPolicy = asyncHandler(async (req, res) => {
  const { policyId, query, topK } = req.body;
  if (!policyId || !query) {
    return res.status(422).json({ success: false, error: "policyId and query are required." });
  }
  const results = await ai.retrievePolicy({ policyId, query, topK: topK || 5 });
  res.json({ success: true, data: results });
});

module.exports = { searchPolicy };
