// Print the salt and verifier for a new Bulletins passcode.
//
//   node scripts/bulletins-passcode.mjs "the new passcode"
//
// Paste the two values over SALT and VERIFIER in bulletins.html. The passcode
// itself is never stored. Every device has to unlock again afterwards.
import { webcrypto as crypto, randomBytes } from 'node:crypto';

const typed = process.argv[2];
if (!typed) {
  console.error('Usage: node scripts/bulletins-passcode.mjs "the new passcode"');
  process.exit(1);
}

// Must match tidy() and ROUNDS in bulletins.html.
const passcode = typed.trim().toLowerCase().replace(/[\s_-]+/g, '-');
const rounds = 310000;

const hex = (buffer) => Buffer.from(buffer).toString('hex');
const salt = randomBytes(16);
const key = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(passcode), 'PBKDF2', false, ['deriveBits']);
const stretched = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds }, key, 256);
const verifier = await crypto.subtle.digest('SHA-256', stretched);

console.log("var SALT = '" + hex(salt) + "';");
console.log("var VERIFIER = '" + hex(verifier) + "';");
