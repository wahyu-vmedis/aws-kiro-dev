/**
 * Bug Condition Exploration Test — Property 1
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 *
 * EXPECTED OUTCOME: FAIL on unfixed code (failure confirms the bug exists).
 * This test encodes the CORRECT expected behavior. It will pass after the fix.
 *
 * Bug: geocodeCity() uses the wrong base URL:
 *   https://geocoding.geo.census.gov/geocoder/locations/invalid
 * instead of:
 *   https://nominatim.openstreetmap.org/search
 */

const fs = require('fs');
const path = require('path');

// ── Read and extract the geocodeCity source ──────────────────────────────────

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract the full geocodeCity function body from the HTML source
const geocodeFnMatch = html.match(/async function geocodeCity\(city\)\s*\{([\s\S]*?)\n\s*\}/);
if (!geocodeFnMatch) {
  console.error('FAIL: Could not locate geocodeCity function in index.html');
  process.exit(1);
}
const geocodeFunctionBody = geocodeFnMatch[0];

// ── Helper ───────────────────────────────────────────────────────────────────

function assert(condition, label, expected, actual) {
  if (condition) {
    console.log('  PASS:', label);
    return true;
  } else {
    console.log('  FAIL:', label);
    console.log('        Expected:', expected);
    console.log('        Actual  :', actual);
    return false;
  }
}

// ── Property 1: Bug Condition — URL correctness ───────────────────────────────
//
// For ANY non-empty city string, the URL constructed inside geocodeCity
// MUST start with 'https://nominatim.openstreetmap.org/search'.
// On UNFIXED code it starts with the census bureau URL instead → FAIL.

console.log('\n=== Property 1: Bug Condition — Nominatim URL and Coordinate Extraction ===\n');

let allPassed = true;

// ── Check 1: Source uses the correct Nominatim base URL ──────────────────────
const CORRECT_URL   = 'https://nominatim.openstreetmap.org/search';
const BUGGY_URL     = 'https://geocoding.geo.census.gov/geocoder/locations/invalid';

const hasBuggyUrl   = geocodeFunctionBody.includes(BUGGY_URL);
const hasCorrectUrl = geocodeFunctionBody.includes(CORRECT_URL);

const check1 = assert(
  hasCorrectUrl && !hasBuggyUrl,
  'geocodeCity uses Nominatim base URL (https://nominatim.openstreetmap.org/search)',
  'URL contains: ' + CORRECT_URL,
  hasBuggyUrl
    ? 'URL contains wrong base: ' + BUGGY_URL
    : 'URL does not contain either expected or buggy base'
);
allPassed = allPassed && check1;

// ── Check 2: Source includes a User-Agent header in the fetch call ───────────
const hasUserAgent = geocodeFunctionBody.includes('User-Agent');

const check2 = assert(
  hasUserAgent,
  'geocodeCity passes a User-Agent header to fetch()',
  'fetch options include User-Agent header',
  'No User-Agent header found in geocodeCity fetch call'
);
allPassed = allPassed && check2;

// ── Check 3: Coordinates are converted with parseFloat ───────────────────────
const hasParseFloat = geocodeFunctionBody.includes('parseFloat');

const check3 = assert(
  hasParseFloat,
  'geocodeCity applies parseFloat() to returned coordinates',
  'return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }',
  'No parseFloat() call found — coordinates returned as raw strings'
);
allPassed = allPassed && check3;

// ── Check 4: URL includes ?q= query-string separator ────────────────────────
//
// The buggy URL appends city directly after "invalid" with no "?q=" separator,
// making the URL doubly malformed even if the domain were correct.
const hasQuerySeparator = geocodeFunctionBody.includes('?q=');

const check4 = assert(
  hasQuerySeparator,
  'geocodeCity URL includes ?q= query parameter separator',
  'URL contains ?q=',
  'URL does not contain ?q= — query string is malformed'
);
allPassed = allPassed && check4;

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n--- Counterexamples documented ---');
if (hasBuggyUrl) {
  console.log(
    '  COUNTEREXAMPLE: geocodeCity("Austin") constructs URL:\n' +
    '    ' + BUGGY_URL + encodeURIComponent('Austin') + '&countrycodes=us&format=json&limit=1\n' +
    '  instead of:\n' +
    '    ' + CORRECT_URL + '?q=' + encodeURIComponent('Austin') + '&countrycodes=us&format=json&limit=1'
  );
  console.log(
    '  COUNTEREXAMPLE: geocodeCity("Zzznotacity") also hits the census URL,\n' +
    '  so it throws "Geocoding failed: Failed to fetch" instead of\n' +
    '  the clean "City not found. Please try a different name." message.'
  );
}
if (!hasUserAgent) {
  console.log('  COUNTEREXAMPLE: No User-Agent header — violates Nominatim usage policy.');
}
if (!hasParseFloat) {
  console.log('  COUNTEREXAMPLE: lat/lon returned as strings, not numbers (parseFloat missing).');
}
if (!hasQuerySeparator) {
  console.log('  COUNTEREXAMPLE: Missing "?q=" separator — URL is doubly malformed.');
}

console.log('\n--- Result ---');
if (!allPassed) {
  console.log('OUTCOME: FAIL (expected on unfixed code — bug confirmed)\n');
  process.exit(1);
} else {
  console.log('OUTCOME: PASS (bug has been fixed)\n');
  process.exit(0);
}
