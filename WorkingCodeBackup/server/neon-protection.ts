/**
 * CRITICAL DATABASE PROTECTION SYSTEM
 * 
 * NeonDB is PERMANENTLY BANNED from this project due to:
 * - Conflicts with Railway PostgreSQL production system
 * - Data integrity issues that caused production failures
 * - Incompatible connection pooling that breaks the mobile API
 * 
 * This protection system prevents accidental NeonDB usage.
 */

// Block any NeonDB imports at runtime
const BANNED_MODULES = [
  '@neondatabase/serverless',
  'drizzle-orm/neon-serverless',
  'drizzle-orm/neon-http'
];

// Simple protection - check for NeonDB usage at startup
if (typeof require !== 'undefined') {
  try {
    // Test if NeonDB modules are present
    const Module = require('module');
    const originalResolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = function(request: string, parent: any) {
      if (BANNED_MODULES.some(banned => request.includes(banned))) {
        throw new Error(`
CRITICAL ERROR: NeonDB Usage Detected!

Module '${request}' is PERMANENTLY BANNED from this project.

WHY: NeonDB caused production failures and database conflicts.
SOLUTION: Use Railway PostgreSQL exclusively via 'pg' package.

Current database setup: server/db.ts uses PostgreSQL correctly.
DO NOT modify the database configuration.

If you see this error:
1. Remove all NeonDB imports immediately  
2. Use the existing Railway PostgreSQL connection
3. Contact the development team if database changes are needed

This protection system prevents data loss and production failures.
`);
      }
      
      return originalResolveFilename.call(this, request, parent);
    };
  } catch (e) {
    // Protection system loaded, continue
  }
}

export const NEON_PROTECTION_ACTIVE = true;

console.log('🛡️  NeonDB Protection System Active - Railway PostgreSQL Only');