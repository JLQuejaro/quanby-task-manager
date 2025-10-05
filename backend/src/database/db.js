"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var postgres_js_1 = require("drizzle-orm/postgres-js");
var postgres_1 = require("postgres");
var schema = require("./schema");
var connectionString = process.env.DATABASE_URL;
var client = (0, postgres_1.default)(connectionString);
exports.db = (0, postgres_js_1.drizzle)(client, { schema: schema });
