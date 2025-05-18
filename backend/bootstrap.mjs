// bootstrap.mjs - Fixed version
import 'dotenv/config';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ts-node with ESM loader using the new approach
register('ts-node/esm', pathToFileURL('./'));

// Import the main server file
import('./server.mts');