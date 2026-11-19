// Change the passcode.
//
//   node scripts/passcode.mjs "the old passcode" "the new passcode"
//
// It rewrites the salt, the hash, and the encrypted store address in sync.js,
// and the hash in worker.js. Commit and push both files together. Every
// device then has to unlock again; the notes are untouched.
//
// The salt and hash are public, so anyone can test guesses against them at
// their own speed. Choose four or more unrelated words.
import { webcrypto as crypto, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [oldTyped, newTyped] = process.argv.slice(2);
if (!oldTyped || !newTyped) {
  console.error('Usage: node scripts/passcode.mjs "the old passcode" "the new passcode"');
  process.exit(1);
}

const SYNC = fileURLToPath(new URL('../sync.js', import.meta.url));
const WORKER = fileURLToPath(new URL('../worker.js', import.meta.url));

// Must match tidy() and ROUNDS in sync.js.
const tidy = (typed) => typed.trim().toLowerCase().replace(/[\s_-]+/g, '-');
const ROUNDS = 310000;

async function stretch(typed, salt) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(tidy(typed)), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ROUNDS }, key, 256);
}

const hex = (buffer) => Buffer.from(buffer).toString('hex');
const hash = async (buffer) => hex(await crypto.subtle.digest('SHA-256', buffer));

let sync = readFileSync(SYNC, 'utf8');
let worker = readFileSync(WORKER, 'utf8');
const field = (name) => new RegExp("(var " + name + " = ')([0-9a-f]+)(')");
const value = (name) => field(name).exec(sync)[2];

// Read the store's address with the old passcode.
const oldKey = await stretch(oldTyped, Buffer.from(value('SALT'), 'hex'));
if (await hash(oldKey) !== value('VERIFIER')) {
  console.error('The old passcode is not right.');
  process.exit(1);
}
const address = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: Buffer.from(value('WHERE_IV'), 'hex') },
  await crypto.subtle.importKey('raw', oldKey, 'AES-GCM', false, ['decrypt']),
  Buffer.from(value('WHERE'), 'hex'));

// Seal it again with the new one.
const salt = randomBytes(16);
const iv = randomBytes(12);
const newKey = await stretch(newTyped, salt);
const verifier = await hash(newKey);
const sealed = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  await crypto.subtle.importKey('raw', newKey, 'AES-GCM', false, ['encrypt']),
  address);

for (const [name, next] of [['SALT', hex(salt)], ['VERIFIER', verifier], ['WHERE_IV', hex(iv)], ['WHERE', hex(sealed)]]) {
  sync = sync.replace(field(name), '$1' + next + '$3');
}
const inWorker = /(const VERIFIER = ')([0-9a-f]+)(')/;
if (!inWorker.test(worker)) {
  console.error('worker.js has no VERIFIER line to update.');
  process.exit(1);
}
worker = worker.replace(inWorker, '$1' + verifier + '$3');

writeFileSync(SYNC, sync);
writeFileSync(WORKER, worker);
console.log('Updated sync.js and worker.js. Commit and push both.');
