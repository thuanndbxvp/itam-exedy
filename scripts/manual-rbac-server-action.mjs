// scripts/manual-rbac-server-action.mjs
// Manually exercise the actual server-action code path in dev mode.
// We import the action module, then override getServerSession via Node's
// require-in-the-middle-style trick: we use the tsx-style dynamic compile.
//
// The real test is the unit test (tests/auth-guard.test.ts) which mocks
// getServerSession. This script verifies the *integration*: that the
// action's `await requireRole('ADMIN')` is reachable on the first line
// of its `runCommand` callback and that it returns { ok: false, code: 'FORBIDDEN' }
// for an EMPLOYEE session.

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Use tsx loader to import TS files at runtime
register('tsx/esm', pathToFileURL('./'));

// Now dynamically import the server actions
const { checkoutAssetCmd, checkinAssetCmd, checkoutAssetToLocationCmd, createAsset } = await import('../src/app/actions/asset.ts');
const { checkoutLicenseSeatCmd, checkinLicenseSeatCmd, expireLicenseSeatCmd, createLicense } = await import('../src/app/actions/license.ts');

import { getServerSession } from 'next-auth';

console.log('=== Manual RBAC server-action smoke (in-process, mocked session) ===\n');

const ADMIN_SESSION = {
  user: { id: 'admin-id', role: 'ADMIN', firstName: 'A', lastName: 'B', email: 'admin@congty.com' },
};
const EMPLOYEE_SESSION = {
  user: { id: 'employee-id', role: 'EMPLOYEE', firstName: 'N', lastName: 'V', email: 'nhanvien@congty.com' },
};

// We can't easily mock ESM imports. Instead, we directly test the path that
// doesn't need DB by triggering ForbiddenError via a session that has wrong role.
// To do that, we need to mock getServerSession. We do this by replacing the
// module exports.
import * as nextAuth from 'next-auth';
const origGetServerSession = nextAuth.getServerSession;
nextAuth.getServerSession = async () => EMPLOYEE_SESSION;

// EMPLOYEE: createAsset
let r = await createAsset({ assetTag: 'TEST-TAG', name: 'Test', statusId: 'fake-status-id' });
console.log('EMPLOYEE → createAsset:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// EMPLOYEE: checkoutAssetCmd
r = await checkoutAssetCmd({ assetId: 'fake', targetUserId: 'fake' });
console.log('EMPLOYEE → checkoutAssetCmd:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// EMPLOYEE: checkinAssetCmd
r = await checkinAssetCmd({ assetId: 'fake' });
console.log('EMPLOYEE → checkinAssetCmd:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// EMPLOYEE: checkoutAssetToLocationCmd
r = await checkoutAssetToLocationCmd({ assetId: 'fake', targetLocationId: 'fake' });
console.log('EMPLOYEE → checkoutAssetToLocationCmd:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// EMPLOYEE: createLicense
r = await createLicense({ name: 'Test', seatsTotal: 1 });
console.log('EMPLOYEE → createLicense:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// EMPLOYEE: checkoutLicenseSeatCmd
r = await checkoutLicenseSeatCmd({ seatId: 'fake', targetUserId: 'fake' });
console.log('EMPLOYEE → checkoutLicenseSeatCmd:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// EMPLOYEE: checkinLicenseSeatCmd
r = await checkinLicenseSeatCmd({ seatId: 'fake' });
console.log('EMPLOYEE → checkinLicenseSeatCmd:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// EMPLOYEE: expireLicenseSeatCmd
r = await expireLicenseSeatCmd({ seatId: 'fake' });
console.log('EMPLOYEE → expireLicenseSeatCmd:', JSON.stringify(r));
if (r.ok !== false || r.code !== 'FORBIDDEN') {
  console.error('  ❌ Expected { ok: false, code: FORBIDDEN }');
  process.exitCode = 1;
} else {
  console.log('  ✅ FORBIDDEN as expected');
}

// Now switch to ADMIN
nextAuth.getServerSession = async () => ADMIN_SESSION;

// ADMIN: should pass role check but may fail on validation (no DB), still not FORBIDDEN
r = await checkoutAssetCmd({ assetId: 'fake-asset', targetUserId: 'fake-user' });
console.log('\nADMIN → checkoutAssetCmd:', JSON.stringify(r));
if (r.code === 'FORBIDDEN') {
  console.error('  ❌ Should not be FORBIDDEN for ADMIN');
  process.exitCode = 1;
} else {
  console.log('  ✅ Not FORBIDDEN (passed role check; other errors OK)');
}

r = await createAsset({ assetTag: 'TEST', name: 'Test', statusId: 'fake' });
console.log('ADMIN → createAsset:', JSON.stringify(r));
if (r.code === 'FORBIDDEN') {
  console.error('  ❌ Should not be FORBIDDEN for ADMIN');
  process.exitCode = 1;
} else {
  console.log('  ✅ Not FORBIDDEN (passed role check; other errors OK)');
}

r = await expireLicenseSeatCmd({ seatId: 'fake' });
console.log('ADMIN → expireLicenseSeatCmd:', JSON.stringify(r));
if (r.code === 'FORBIDDEN') {
  console.error('  ❌ Should not be FORBIDDEN for ADMIN');
  process.exitCode = 1;
} else {
  console.log('  ✅ Not FORBIDDEN (passed role check; other errors OK)');
}

nextAuth.getServerSession = origGetServerSession;
console.log('\n=== Done ===');
