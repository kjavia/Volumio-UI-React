#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(cmd, cwd) {
  console.log(`\n[${path.basename(cwd)}] $ ${cmd}`);
  const out = execSync(cmd, { cwd, stdio: 'inherit' });
  return out;
}

const uiRepo = path.resolve(__dirname, '..');
const pluginRepo = path.resolve(uiRepo, '..', 'volumio-plugins-sources-bookworm');
const uiDist = path.resolve(uiRepo, 'dist');
const targetApp = path.resolve(pluginRepo, 'stylish_player', 'app');

if (!fs.existsSync(uiRepo)) {
  throw new Error(`UI repo not found at ${uiRepo}`);
}
if (!fs.existsSync(pluginRepo)) {
  throw new Error(`plugin repo not found at ${pluginRepo}`);
}

const lastCommit = execSync('git log -1 --pretty=%B', { cwd: uiRepo }).toString().trim();
const commitMessage = `${lastCommit} build`;

console.log(`\nCommit message: ${commitMessage}`);

// Build UI repo
run('npm install', uiRepo);
run('npm run build', uiRepo);

if (!fs.existsSync(uiDist)) {
  throw new Error(`dist folder not found at ${uiDist}`);
}

// Clear target folder contents
if (fs.existsSync(targetApp)) {
  console.log(`Clearing folder ${targetApp}`);
  fs.rmSync(targetApp, { recursive: true, force: true });
}

fs.mkdirSync(targetApp, { recursive: true });

// Copy built files to target
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyRecursive(from, to);
    } else if (entry.isSymbolicLink()) {
      const symlink = fs.readlinkSync(from);
      fs.symlinkSync(symlink, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

copyRecursive(uiDist, targetApp);

function gitAddCommitPush(repoPath) {
  run('git add .', repoPath);

  try {
    run(`git commit -m "${commitMessage}"`, repoPath);
  } catch (err) {
    const msg = err.message || '';
    console.log(msg);
    if (msg.includes('nothing to commit') || msg.includes('no changes added to commit')) {
      console.log(`No changes to commit in ${path.basename(repoPath)}; skipping commit/push.`);
      return;
    }
    throw err;
  }

  try {
    run('git push origin HEAD', repoPath);
  } catch (err) {
    const msg = err.message || '';
    console.log(msg);
    if (msg.includes('Everything up-to-date') || msg.includes('already up to date')) {
      console.log(`Repository ${path.basename(repoPath)} is already up-to-date; no push needed.`);
      return;
    }
    throw err;
  }
}

// Git commit + push in plugin repo
gitAddCommitPush(pluginRepo);

// Git commit + push in UI repo
gitAddCommitPush(uiRepo, true);

console.log('\nAll done!');
