#!/usr/bin/env node
/**
 * 测试 imapflow 连接网易邮箱（含 ID 命令）
 * 
 * 使用方法：
 *   EMAIL_USER=你的邮箱@163.com EMAIL_PASSWORD=你的授权码 node test-imapflow.js
 * 
 * 或者直接修改下面的默认值
 */

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

// 从环境变量读取，或使用默认值（请替换为你自己的）
const EMAIL_USER = process.env.EMAIL_USER || 'your-email@163.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'your-auth-code';

// 客户端标识信息（IMAP ID 命令，RFC 2971）
const CLIENT_INFO = {
  name: 'mcp-email-imapflow-test',
  version: '1.0.0',
  'support-url': 'https://github.com/TimeCyber/email-mcp'
};

async function main() {
  console.log('========================================');
  console.log('  imapflow 网易邮箱连接测试');
  console.log('========================================');
  console.log(`邮箱: ${EMAIL_USER}`);
  console.log(`服务器: imap.163.com:993 (SSL)`);
  console.log(`客户端ID: ${JSON.stringify(CLIENT_INFO)}`);
  console.log('----------------------------------------');

  const client = new ImapFlow({
    host: 'imap.163.com',
    port: 993,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    },
    clientInfo: { ...CLIENT_INFO },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    disableAutoIdle: true,
    logger: false
  });

  try {
    // 1. 连接（会自动发送 ID 命令）
    console.log('\n[1/5] 正在连接并发送 ID 命令...');
    await client.connect();
    console.log('✅ 连接成功！');
    console.log('   服务器返回的 ID 信息:', JSON.stringify(client.serverInfo));
    console.log('   支持的能力:', Array.from(client.capabilities.keys()).join(', '));

    // 2. 打开收件箱
    console.log('\n[2/5] 正在打开收件箱 (INBOX)...');
    const lock = await client.getMailboxLock('INBOX');
    console.log('✅ 收件箱打开成功！');
    console.log('   邮件总数:', client.mailbox.exists);
    console.log('   未读邮件:', client.mailbox.unseen);

    try {
      // 3. 搜索最近的邮件
      console.log('\n[3/5] 正在搜索邮件...');
      const allUids = await client.search({ all: true });
      console.log(`✅ 找到 ${allUids.length} 封邮件`);

      if (allUids.length > 0) {
        // 取最近3封
        const recentUids = allUids.slice(-3);
        console.log(`   最近3封 UID: ${recentUids.join(', ')}`);

        // 4. 获取邮件头部
        console.log('\n[4/5] 正在获取邮件头部信息...');
        const messages = await client.fetchAll(recentUids, {
          uid: true,
          envelope: true,
          internalDate: true
        });

        for (const msg of messages) {
          const env = msg.envelope || {};
          console.log(`   📧 UID: ${msg.uid}`);
          console.log(`      日期: ${msg.internalDate?.toLocaleString() || '未知'}`);
          console.log(`      发件人: ${env.from?.map(f => `${f.name || ''} <${f.address}>`).join(', ') || '未知'}`);
          console.log(`      主题: ${env.subject || '(无主题)'}`);
        }

        // 5. 获取最新一封邮件的完整内容
        console.log('\n[5/5] 正在获取最新邮件的完整内容...');
        const latestUid = recentUids[recentUids.length - 1];
        const { meta, content } = await client.download(latestUid.toString());

        if (content) {
          const chunks = [];
          for await (const chunk of content) {
            chunks.push(chunk);
          }
          const rawEmail = Buffer.concat(chunks);
          const parsed = await simpleParser(rawEmail);

          console.log(`✅ 邮件内容获取成功！`);
          console.log(`   主题: ${parsed.subject || '(无主题)'}`);
          console.log(`   发件人: ${parsed.from?.text || '未知'}`);
          console.log(`   日期: ${parsed.date || '未知'}`);
          console.log(`   文本内容长度: ${parsed.text?.length || 0} 字符`);
          if (parsed.text) {
            console.log(`   文本内容预览: ${parsed.text.substring(0, 200)}${parsed.text.length > 200 ? '...' : ''}`);
          }
          if (parsed.attachments?.length > 0) {
            console.log(`   附件数量: ${parsed.attachments.length}`);
          }
        } else {
          console.log('⚠️  未获取到邮件内容');
        }
      }
    } finally {
      lock.release();
    }

    console.log('\n========================================');
    console.log('  🎉 全部测试通过！IMAP + ID 命令工作正常');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   服务器响应:', error.response);
    }
    process.exit(1);
  } finally {
    try {
      await client.logout();
    } catch (e) {
      client.close();
    }
  }
}

main();
