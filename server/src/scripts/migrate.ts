import { runMigrations } from "../db/client.js";

runMigrations();
console.log("Migrations applied.");
