import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Import all schemas
import * as users from '../schema/users';
import * as projects from '../schema/projects';
import * as properties from '../schema/properties';
import * as walks from '../schema/walks';
import * as unitTypes from '../schema/unitTypes';
import * as scope from '../schema/scope';
import * as tasks from '../schema/tasks';
import * as documents from '../schema/documents';
import * as notifications from '../schema/notifications';
import * as residents from '../schema/residents';
import * as bulletins from '../schema/bulletins';
import * as schedule from '../schema/schedule';
import * as maintenance from '../schema/maintenance';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Drizzle instance with all schemas
export const db = drizzle(client, {
  schema: {
    ...users,
    ...projects,
    ...properties,
    ...walks,
    ...unitTypes,
    ...scope,
    ...tasks,
    ...documents,
    ...notifications,
    ...residents,
    ...bulletins,
    ...schedule,
    ...maintenance,
  },
});

export type Database = typeof db;
