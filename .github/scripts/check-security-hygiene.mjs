import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const fail = (message) => {
  console.error(`security hygiene failed: ${message}`);
  process.exit(1);
};

const read = (path) => readFileSync(path, 'utf8');
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const forbiddenTracked = tracked.filter((path) => {
  if (path === '.env.example') return false;
  return /(^|\/)\.env(?:\.|$)/.test(path) || /(^|\/)(?:logs\/.*|.*\.log|warning\.log)$/.test(path);
});

if (forbiddenTracked.length > 0) {
  fail(`runtime secret/log files are tracked: ${forbiddenTracked.join(', ')}`);
}

const indexSource = read('src/index.js');
if (!/cookieParser\(\s*\)/.test(indexSource)) {
  fail('src/index.js must use cookieParser() without a source-controlled signing secret');
}
for (const contract of [
  'resave: false',
  'saveUninitialized: false',
  'httpOnly: true',
  "sameSite: isProduction ? 'none' : 'lax'",
  'secure: isProduction',
  'origin: config.frontendOrigin',
]) {
  if (!indexSource.includes(contract)) {
    fail(`src/index.js lost session/CORS contract: ${contract}`);
  }
}

const sessionSource = read('src/controllers/session.controller.js');
if (/console\.log\s*\(/.test(sessionSource)) {
  fail('session.controller.js must not use console.log in authentication flows');
}
if (/console\.(?:log|info|debug|warn|error)\s*\([^\n]*(?:password|newPassword|resetPasswordToken)/i.test(sessionSource)) {
  fail('session.controller.js appears to log password or reset-token material');
}
for (const contract of [
  'delete plainUser.password',
  'delete plainUser.resetPasswordToken',
  'delete plainUser.resetPasswordExpires',
  'httpOnly: true',
  'secure: isProduction',
]) {
  if (!sessionSource.includes(contract)) {
    fail(`session.controller.js lost auth-sanitization contract: ${contract}`);
  }
}

const dockerIgnore = read('.dockerignore');
for (const contract of ['.env', '.env.*', 'logs', '*.log', 'src/public/documents']) {
  if (!dockerIgnore.includes(contract)) {
    fail(`.dockerignore lost required exclusion: ${contract}`);
  }
}

const envExample = read('.env.example');
const requiredNames = [
  'PORT', 'MODE', 'FRONTEND_ORIGIN', 'PERSISTENCE', 'MONGO_URL', 'JWT_SECRET',
  'TOKEN_KEY', 'HASH_KEY', 'GIT_CLIENT_ID', 'GIT_CLIENT_SECRET', 'GIT_CALLBACK_URL',
  'GIT_APP_ID', 'SERVICE_MAIL', 'SERVICE_MAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_SMS_NUMBER',
];
const parsed = new Map();
for (const rawLine of envExample.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const separator = line.indexOf('=');
  if (separator < 1) fail('.env.example contains an invalid assignment');
  parsed.set(line.slice(0, separator), line.slice(separator + 1));
}
for (const name of requiredNames) {
  if (!parsed.has(name)) fail(`.env.example is missing ${name}`);
}
for (const name of [
  'MONGO_URL', 'JWT_SECRET', 'TOKEN_KEY', 'HASH_KEY', 'GIT_CLIENT_SECRET',
  'EMAIL_PASSWORD', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN',
]) {
  if (parsed.get(name)) {
    fail(`.env.example must not contain a value for sensitive variable ${name}`);
  }
}

console.log('security hygiene passed');
