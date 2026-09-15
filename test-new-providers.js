import { UniversalEmailMCPServer } from './index.js';

console.log('🔍 测试新增的邮箱检测功能');
console.log('─────────────────────────────────');

const server = new UniversalEmailMCPServer();

const testEmails = [
  { email: 'user@gmail.com', expected: 'gmail', name: 'Gmail' },
  { email: 'user@outlook.com', expected: 'outlook', name: 'Outlook' },
  { email: 'user@hotmail.com', expected: 'outlook', name: 'Hotmail' },
  { email: 'user@live.com', expected: 'outlook', name: 'Live' },
  { email: 'user@aliyun.com', expected: 'aliyun', name: '阿里云邮箱' },
  { email: 'user@sina.com', expected: 'sina', name: '新浪邮箱' },
  { email: 'user@sina.cn', expected: 'sina', name: '新浪CN' },
  { email: 'user@sohu.com', expected: 'sohu', name: '搜狐邮箱' }
];

for (const { email, expected, name } of testEmails) {
  const detected = server.detectEmailProvider(email);
  const status = detected === expected ? '✅' : '❌';
  console.log(`${status} ${name.padEnd(12)} | ${email.padEnd(18)} | 检测: ${detected || 'null'}`);
}

console.log('\n✅ 邮箱检测功能测试完成！'); 