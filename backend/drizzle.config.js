"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var drizzle_kit_1 = require("drizzle-kit");
var dotenv = require("dotenv");
dotenv.config();
exports.default = (0, drizzle_kit_1.defineConfig)({
    schema: './src/database/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
