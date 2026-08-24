const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: `${AI_SERVICE_URL}/ai`,
  timeout: 60000, // embedding + LLM calls can be slow on first run (model load)
});

// Every AI service response is normalized to { success, data } by FastAPI;
// on failure we surface FastAPI's `detail` message through errorHandler.js.
async function call(method, path, payload) {
  try {
    const res = await client.request({ method, url: path, data: payload });
    return res.data.data;
  } catch (err) {
    if (err.response) {
      const wrapped = new Error(err.response.data?.detail || "AI service request failed.");
      wrapped.status = err.response.status;
      wrapped.response = err.response;
      throw wrapped;
    }
    err.userMessage = "Could not reach the AI analysis service.";
    throw err;
  }
}

module.exports = {
  parseClaim: (payload) => call("post", "/parse-claim", payload),
  getDenialCode: (code) => client.get(`/denial-codes/${encodeURIComponent(code)}`).then((r) => r.data.data),
  extractClinicalEvidence: (payload) => call("post", "/extract-clinical-evidence", payload),
  indexPolicy: (payload) => call("post", "/index-policy", payload),
  retrievePolicy: (payload) => call("post", "/retrieve-policy", payload),
  extractRequirements: (payload) => call("post", "/extract-requirements", payload),
  matchEvidence: (payload) => call("post", "/match-evidence", payload),
  scoreAppealability: (payload) => call("post", "/score-appealability", payload),
  generateAppeal: (payload) => call("post", "/generate-appeal", payload),
  generatePacket: (payload) => call("post", "/generate-packet", payload),
};
