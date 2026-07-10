import { config } from "./config.js";
import { createApp } from "./app.js";
import { runMigrations } from "./db/client.js";

runMigrations();

const app = createApp();
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
