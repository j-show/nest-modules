/**
 * 从 template/ 脚手架创建 packages/nest-<NAME> 工作区包。
 *
 * 用法：node ./scripts/create-pkg.cjs <NAME>
 * NAME 转小写后须匹配 /^[a-z0-9][a-z0-9-]*$/，且目标目录不得已存在。
 */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const templateDir = path.join(root, 'template');
const packagesDir = path.join(root, 'packages');

const fail = message => {
  console.error(message);
  process.exit(1);
};

const replacePlaceholders = (content, NAME, DNAME) =>
  content.replaceAll('{NAME}', NAME).replaceAll('{DNAME}', DNAME);

const rawName = process.argv[2];

if (!rawName || !rawName.trim()) {
  fail('NAME is required. Usage: node ./scripts/create-pkg.cjs <NAME>');
}

const NAME = rawName.trim().toLowerCase();

if (!NAME) {
  fail('NAME must not be empty.');
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(NAME)) {
  fail('NAME must contain only lowercase letters, digits, and hyphens.');
}

const pkgDirName = `nest-${NAME}`;
const targetDir = path.join(packagesDir, pkgDirName);

if (!fs.existsSync(templateDir)) {
  fail(`Template directory not found: ${templateDir}`);
}

if (fs.existsSync(targetDir)) {
  fail(`Package directory already exists: packages/${pkgDirName}`);
}

const DNAME = NAME.charAt(0).toUpperCase() + NAME.slice(1);

fs.cpSync(templateDir, targetDir, { recursive: true });

for (const relPath of ['src/index.ts', 'package.json', 'vite.config.ts']) {
  const filePath = path.join(targetDir, relPath);

  if (!fs.existsSync(filePath)) {
    fail(`Expected template file missing: ${relPath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(filePath, replacePlaceholders(content, NAME, DNAME), 'utf8');
}

console.log(`Created packages/${pkgDirName}`);
