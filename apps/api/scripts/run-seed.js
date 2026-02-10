'use strict';
const path = require('path');

// So ts-node and tsconfig-paths use the API tsconfig (which extends base and has path mappings)
process.env.TS_NODE_PROJECT = path.resolve(__dirname, '../tsconfig.app.json');
process.env.TS_NODE_TRANSPILE_ONLY = 'true';

require('dotenv/config');
require('tsconfig-paths/register');
require('ts-node/register');
require('../src/database/seeds/run-seed');
