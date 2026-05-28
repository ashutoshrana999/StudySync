const http = require("http");
const app = require("./app");
const { connectDb } = require("./config/db");
const { env, validateEnv } = require("./config/env");

async function main() {
  validateEnv();
  await connectDb(env.MONGO_URI);

  const server = http.createServer(app);
  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`StudySync API running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
