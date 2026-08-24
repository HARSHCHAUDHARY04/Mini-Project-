// Creates default demo accounts so the app can be logged into immediately
// after setup, per README "Demo Workflow" instructions.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");

async function seed() {
  await connectDB();

  const accounts = [
    { name: "Alex Rivera", email: "admin@claimassist.demo", password: "Demo1234!", role: "admin" },
    { name: "Jordan Lee", email: "reviewer@claimassist.demo", password: "Demo1234!", role: "reviewer" },
  ];

  for (const acc of accounts) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) {
      console.log(`[seed] ${acc.email} already exists, skipping.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(acc.password, 10);
    await User.create({ name: acc.name, email: acc.email, passwordHash, role: acc.role });
    console.log(`[seed] Created ${acc.role} account: ${acc.email} / ${acc.password}`);
  }

  console.log("[seed] Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
