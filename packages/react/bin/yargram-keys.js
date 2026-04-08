#!/usr/bin/env node
/* eslint-disable no-console */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { bits: 2048, outDir: process.cwd(), name: 'yargram' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bits') args.bits = Number(argv[++i] ?? '2048');
    else if (a === '--out-dir') args.outDir = String(argv[++i] ?? process.cwd());
    else if (a === '--name') args.name = String(argv[++i] ?? 'yargram');
    else if (a === '-h' || a === '--help') args.help = true;
  }
  return args;
}

function usage() {
  console.log(`yargram-keys

Usage:
  yargram-keys [--bits 2048] [--out-dir ./keys] [--name yargram]

Outputs:
  <out-dir>/<name>.private.pkcs8.pem
  <out-dir>/<name>.public.spki.pem

Also prints:
  YARGRAM_PUBLIC_KEY_DER_BASE64 (recommended)
  YARGRAM_PUBLIC_KEY_PEM (single-line with \\n)
`);
}

function pemToEnvOneLine(pem) {
  return pem.replace(/\r?\n/g, '\\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }
  if (!Number.isFinite(args.bits) || args.bits < 1024) {
    console.error('Invalid --bits. Use e.g. 2048 or 3072.');
    process.exit(1);
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: args.bits,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const privPath = path.join(outDir, `${args.name}.private.pkcs8.pem`);
  const pubPath = path.join(outDir, `${args.name}.public.spki.pem`);

  fs.writeFileSync(privPath, privateKey, 'utf8');
  fs.writeFileSync(pubPath, publicKey, 'utf8');

  const pubDer = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
  const pubDerBase64 = Buffer.from(pubDer).toString('base64');

  console.log('Generated keys:');
  console.log(`  private: ${privPath}`);
  console.log(`  public : ${pubPath}`);
  console.log('');
  console.log('Environment variables:');
  console.log(`  export YARGRAM_PUBLIC_KEY_DER_BASE64="${pubDerBase64}"`);
  console.log(`  export YARGRAM_PUBLIC_KEY_PEM="${pemToEnvOneLine(publicKey)}"`);
}

main();
