# 🚨 CRITICAL DATABASE PROTECTION WARNING 🚨

## NeonDB is PERMANENTLY BANNED from this project

### WHY NeonDB is Forbidden:
1. **Production Failures**: NeonDB caused multiple production outages
2. **Data Conflicts**: Incompatible with Railway PostgreSQL system
3. **Mobile API Issues**: Breaks the mobile upload endpoint functionality
4. **Connection Problems**: Conflicts with existing pooling system

### Current Database Configuration:
- **ONLY USE**: Railway PostgreSQL via `pg` package
- **Configuration File**: `server/db.ts` (DO NOT MODIFY)
- **Protection System**: `server/neon-protection.ts` blocks NeonDB imports

### If You See NeonDB References:
1. **STOP IMMEDIATELY** - Do not proceed with NeonDB integration
2. **Remove all NeonDB imports** from any file
3. **Use existing Railway PostgreSQL connection** in `server/db.ts`
4. **Contact development team** if database changes are needed

### Approved Database Usage:
```typescript
// ✅ CORRECT - Use existing Railway connection
import { db } from './db';

// ❌ FORBIDDEN - Never import NeonDB
import { neon } from '@neondatabase/serverless';
```

### Protection System Active:
- Runtime protection blocks NeonDB module loading
- Automatic error messages guide to correct database usage
- Production deployment uses Railway PostgreSQL exclusively

**This protection system prevents data loss and production failures.**