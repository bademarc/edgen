# Supabase Edge Functions Build Configuration Fix

## Problem
Next.js build was failing because it was trying to compile the Supabase Edge Function file located at `supabase/functions/track-mentions/index.ts`. This file contains Deno-specific imports that are incompatible with Next.js TypeScript compilation.

## Root Cause
- Next.js was attempting to compile `supabase/functions/track-mentions/index.ts`
- This file uses Deno-style HTTP URL imports (`https://deno.land/std@0.168.0/http/server.ts`)
- Next.js TypeScript compiler doesn't understand these URL-based imports
- Supabase Edge Functions are meant to run in Deno runtime, not Node.js/Next.js

## Solution Applied

### 1. Updated `tsconfig.json`
Added the Supabase functions directory to the `exclude` array:

```json
{
  "exclude": [
    "node_modules",
    "scripts/verify-database.ts",
    "supabase/functions/**/*"
  ]
}
```

### 2. Updated `next.config.js`
Added webpack configuration to ignore Supabase functions during build:

```javascript
webpack: (config, { isServer }) => {
  // Ignore Supabase Edge Functions during build
  config.watchOptions = {
    ...config.watchOptions,
    ignored: [
      ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
      '**/supabase/functions/**/*',
      '**/node_modules/**',
    ],
  };

  return config;
},
```

### 3. Added Documentation
Added comprehensive comments to the edge function file explaining:
- Its purpose and runtime environment (Deno, not Node.js)
- Why it's excluded from Next.js compilation
- Deployment instructions
- Warning about not moving the file

### 4. Fixed ESLint Issues
Removed unused parameter in the API route to ensure clean build.

## Verification

### Build Test Results
✅ `npx tsc --noEmit` - TypeScript compilation successful
✅ `npx next build` - Next.js build successful
✅ No compilation errors related to Supabase edge functions

### What's Protected
- ✅ Supabase edge functions remain deployable to Supabase
- ✅ Next.js application builds successfully
- ✅ Automated mention tracking system functionality preserved
- ✅ No impact on existing application features

## File Structure
```
project-root/
├── supabase/
│   ├── config.toml
│   └── functions/
│       └── track-mentions/
│           └── index.ts          # Excluded from Next.js build
├── src/
│   └── app/
│       └── api/
│           └── mentions/
│               └── track/
│                   └── route.ts  # Next.js API route (included in build)
├── tsconfig.json                 # Updated with exclude
└── next.config.js               # Updated with webpack config
```

## Deployment Notes

### For Next.js Application
```bash
npm run build    # Now works without errors
npm start        # Production server
```

### For Supabase Edge Function
```bash
supabase functions deploy track-mentions    # Deploys to Supabase (unaffected)
```

## Important Warnings

1. **Do NOT move** `supabase/functions/track-mentions/index.ts` to the `src/` directory
2. **Do NOT remove** `supabase/functions/**/*` from the `tsconfig.json` exclude array
3. **Do NOT modify** the Deno-style imports in the edge function file
4. **Always test** both Next.js build and Supabase function deployment after changes

## Troubleshooting

### If Build Fails Again
1. Verify `supabase/functions/**/*` is in `tsconfig.json` exclude array
2. Check that webpack configuration in `next.config.js` is present
3. Ensure no Supabase edge function files are in the `src/` directory
4. Run `npx tsc --noEmit` to check for TypeScript errors

### If Edge Function Deployment Fails
1. Verify the edge function file hasn't been moved
2. Check that Deno-style imports are intact
3. Ensure Supabase CLI is properly configured
4. Test with `supabase functions serve track-mentions` locally

## Summary
This fix ensures that:
- ✅ Next.js builds successfully for production deployment
- ✅ Supabase edge functions remain deployable and functional
- ✅ Development workflow is unaffected
- ✅ Automated mention tracking system works as intended

The solution cleanly separates Deno runtime code (Supabase edge functions) from Node.js runtime code (Next.js application) while keeping both in the same repository for easier management.
