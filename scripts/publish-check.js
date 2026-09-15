#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 发布前检查...\n');

// 检查必要文件
const requiredFiles = ['index.js', 'README.md', 'CONFIG_GUIDE.md', 'LICENSE', 'package.json'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ 缺少必要文件:', missingFiles);
  process.exit(1);
}

// 检查package.json配置
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = ['name', 'version', 'description', 'main', 'author', 'license'];
const missingFields = requiredFields.filter(field => !packageJson[field]);

if (missingFields.length > 0) {
  console.error('❌ package.json缺少必要字段:', missingFields);
  process.exit(1);
}

// 检查版本格式
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(packageJson.version)) {
  console.error('❌ 版本号格式不正确:', packageJson.version);
  process.exit(1);
}

// 检查依赖
if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
  console.warn('⚠️  没有声明依赖项');
}

console.log('✅ 所有必要文件存在');
console.log('✅ package.json配置正确');
console.log('✅ 版本号格式正确');
console.log('✅ 发布前检查通过!\n');

console.log('📦 即将发布的包信息:');
console.log(`   名称: ${packageJson.name}`);
console.log(`   版本: ${packageJson.version}`);
console.log(`   描述: ${packageJson.description}`);
console.log(`   主文件: ${packageJson.main}`);
console.log(`   作者: ${packageJson.author}`);
console.log(`   许可证: ${packageJson.license}\n`);

console.log('🚀 准备发布！使用以下命令完成发布：');
console.log('   npm publish'); 