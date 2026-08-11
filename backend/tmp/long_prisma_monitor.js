require('dotenv/config');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const DURATION_SECONDS = Number(process.env.DURATION_SECONDS) || 3600; // default 60 minutes
const INTERVAL_MS = 1000;
const iterations = Math.ceil(DURATION_SECONDS * 1000 / INTERVAL_MS);

const startTs = new Date().toISOString().replace(/[:.]/g, '-');
const logPath = path.join(__dirname, `prisma_monitor_${startTs}.log`);
const out = fs.createWriteStream(logPath, { flags: 'a' });

function logLine(obj) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...obj });
  out.write(line + '\n');
  console.log(line);
}

async function main() {
  const p = new PrismaClient({ log: ['info', 'warn', 'error'] });
  let errors = 0;
  try {
    await p.$connect();
    logLine({ event: 'connected', iterations });
    for (let i = 1; i <= iterations; i++) {
      try {
        await p.user.findMany({ take: 1 });
        logLine({ iter: i, status: 'ok' });
      } catch (e) {
        errors++;
        logLine({ iter: i, status: 'error', message: e && e.message, stack: e && e.stack });
      }
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  } catch (e) {
    errors++;
    logLine({ event: 'connect-failed', message: e && e.message, stack: e && e.stack });
  } finally {
    try { await p.$disconnect(); } catch (_) {}
    logLine({ event: 'finished', errors });
    out.end();
  }
}

main();
