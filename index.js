#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import POP3Client from 'poplib';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 客户端标识信息（用于 IMAP ID 命令，RFC 2971）
// 网易邮箱等要求客户端发送 ID 命令声明身份，否则会拒绝 SELECT/EXAMINE
const IMAP_CLIENT_INFO = {
  name: 'mcp-email-imapflow',
  version: '1.0.0',
  'support-url': 'https://github.com/TimeCyber/email-mcp'
};

// 邮箱配置映射
const EMAIL_CONFIGS = {
  'qq': {
    name: 'QQ邮箱',
    domains: ['qq.com'],
    smtp: { host: 'smtp.qq.com', port: 587, secure: false },
    imap: { host: 'imap.qq.com', port: 993, secure: true },
    pop3: { host: 'pop.qq.com', port: 995, secure: true },
    usePOP3: false
  },
  '163': {
    name: '网易邮箱',
    domains: ['163.com', 'yeah.net'],
    smtp: { host: 'smtp.163.com', port: 465, secure: true },
    imap: { host: 'imap.163.com', port: 993, secure: true },
    pop3: { host: 'pop.163.com', port: 995, secure: true },
    usePOP3: false // 魔改版：使用 imapflow + ID 命令，IMAP 已可正常工作
  },
  '126': {
    name: '网易126邮箱',
    domains: ['126.com'],
    smtp: { host: 'smtp.126.com', port: 465, secure: true },
    imap: { host: 'imap.126.com', port: 993, secure: true },
    pop3: { host: 'pop.126.com', port: 995, secure: true },
    usePOP3: false
  },
  'gmail': {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    smtp: { host: 'smtp.gmail.com', port: 587, secure: true },
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    pop3: { host: 'pop.gmail.com', port: 995, secure: true },
    usePOP3: false,
    requiresOAuth: true,
    note: '需要在Gmail设置中启用POP/IMAP，Google Workspace需要管理员启用'
  },
  'outlook': {
    name: 'Outlook/Hotmail',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    pop3: { host: 'outlook.office365.com', port: 995, secure: true },
    usePOP3: false
  },
  'exmail': {
    name: '腾讯企业邮箱',
    domains: ['exmail.qq.com'],
    smtp: { host: 'smtp.exmail.qq.com', port: 465, secure: true },
    imap: { host: 'imap.exmail.qq.com', port: 993, secure: true },
    pop3: { host: 'pop.exmail.qq.com', port: 995, secure: true },
    usePOP3: false
  },
  'aliyun': {
    name: '阿里云邮箱',
    domains: ['aliyun.com', 'alibaba-inc.com'],
    smtp: { host: 'smtp.mxhichina.com', port: 465, secure: true },
    imap: { host: 'imap.mxhichina.com', port: 993, secure: true },
    pop3: { host: 'pop.mxhichina.com', port: 995, secure: true },
    usePOP3: false
  },
  'sina': {
    name: '新浪邮箱',
    domains: ['sina.com', 'sina.cn'],
    smtp: { host: 'smtp.sina.com', port: 587, secure: false },
    imap: { host: 'imap.sina.com', port: 993, secure: true },
    pop3: { host: 'pop.sina.com', port: 995, secure: true },
    usePOP3: false
  },
  'sohu': {
    name: '搜狐邮箱',
    domains: ['sohu.com'],
    smtp: { host: 'smtp.sohu.com', port: 25, secure: false },
    imap: { host: 'imap.sohu.com', port: 993, secure: true },
    pop3: { host: 'pop.sohu.com', port: 995, secure: true },
    usePOP3: false
  }
};

class UniversalEmailMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'universal-email-server',
        version: '1.0.0-imapflow',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  // 根据邮箱地址或手动指定类型识别邮箱类型
  detectEmailProvider(email, manualType = null) {
    if (manualType && EMAIL_CONFIGS[manualType]) {
      console.log(`使用手动指定的邮箱类型: ${manualType} (${EMAIL_CONFIGS[manualType].name})`);
      return manualType;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    
    for (const [provider, config] of Object.entries(EMAIL_CONFIGS)) {
      if (config.domains.includes(domain)) {
        console.log(`自动检测到邮箱类型: ${provider} (${config.name})`);
        return provider;
      }
    }
    
    console.log(`未能识别邮箱类型，域名: ${domain}`);
    return null;
  }

  // 根据邮箱类型自动配置服务器设置
  autoConfigureByProvider(provider) {
    const config = EMAIL_CONFIGS[provider];
    if (!config) {
      throw new Error(`不支持的邮箱类型: ${provider}`);
    }

    process.env.EMAIL_SMTP_HOST = config.smtp.host;
    process.env.EMAIL_SMTP_PORT = config.smtp.port.toString();
    process.env.EMAIL_SMTP_SECURE = config.smtp.secure.toString();

    process.env.EMAIL_IMAP_HOST = config.imap.host;
    process.env.EMAIL_IMAP_PORT = config.imap.port.toString();
    process.env.EMAIL_IMAP_SECURE = config.imap.secure.toString();

    process.env.EMAIL_POP3_HOST = config.pop3.host;
    process.env.EMAIL_POP3_PORT = config.pop3.port.toString();
    process.env.EMAIL_POP3_SECURE = config.pop3.secure.toString();

    process.env.EMAIL_USE_POP3 = config.usePOP3.toString();

    return config;
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_email',
            description: '发送邮件',
            inputSchema: {
              type: 'object',
              properties: {
                to: { type: 'array', items: { type: 'string' }, description: '收件人邮箱地址列表' },
                cc: { type: 'array', items: { type: 'string' }, description: '抄送邮箱地址列表（可选）' },
                bcc: { type: 'array', items: { type: 'string' }, description: '密送邮箱地址列表（可选）' },
                subject: { type: 'string', description: '邮件主题' },
                text: { type: 'string', description: '纯文本邮件内容' },
                html: { type: 'string', description: 'HTML格式邮件内容（可选）' },
                attachments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string', description: '附件文件名' },
                      path: { type: 'string', description: '附件文件路径' },
                      content: { type: 'string', description: '附件内容(base64编码)' }
                    }
                  },
                  description: '邮件附件列表（可选）'
                }
              },
              required: ['to', 'subject', 'text']
            }
          },
          {
            name: 'get_recent_emails',
            description: '获取最近三天的邮件列表',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: '返回邮件数量限制（默认20）' },
                days: { type: 'number', description: '获取最近几天的邮件（默认3天）' }
              },
              required: []
            }
          },
          {
            name: 'get_email_content',
            description: '获取指定邮件的详细内容',
            inputSchema: {
              type: 'object',
              properties: {
                uid: { type: 'string', description: '邮件唯一标识符' }
              },
              required: ['uid']
            }
          },
          {
            name: 'setup_email_account',
            description: '设置邮箱账号（自动识别邮箱类型并配置服务器）',
            inputSchema: {
              type: 'object',
              properties: {
                email: { type: 'string', description: '邮箱地址（如 user@qq.com）' },
                password: { type: 'string', description: '邮箱密码或授权码' },
                provider: {
                  type: 'string',
                  enum: ['qq', '163', '126', 'gmail', 'outlook', 'exmail', 'aliyun', 'sina', 'sohu'],
                  description: '邮箱提供商（可选，不填写则自动识别）'
                }
              },
              required: ['email', 'password']
            }
          },
          {
            name: 'list_supported_providers',
            description: '列出支持的邮箱提供商',
            inputSchema: { type: 'object', properties: {}, required: [] }
          },
          {
            name: 'configure_email_server',
            description: '手动配置邮箱服务器设置（高级用户使用）',
            inputSchema: {
              type: 'object',
              properties: {
                smtpHost: { type: 'string', description: 'SMTP服务器地址' },
                smtpPort: { type: 'number', description: 'SMTP端口' },
                smtpSecure: { type: 'boolean', description: '是否使用SSL' },
                imapHost: { type: 'string', description: 'IMAP服务器地址' },
                imapPort: { type: 'number', description: 'IMAP端口' },
                imapSecure: { type: 'boolean', description: '是否使用SSL' },
                user: { type: 'string', description: '邮箱账号' },
                password: { type: 'string', description: '邮箱密码或授权码' }
              },
              required: ['user', 'password']
            }
          },
          {
            name: 'test_email_connection',
            description: '测试邮箱服务器连接',
            inputSchema: {
              type: 'object',
              properties: {
                testType: {
                  type: 'string',
                  enum: ['smtp', 'imap', 'both'],
                  description: '测试类型：smtp（发送）、imap（接收）或both（全部）'
                }
              },
              required: []
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'send_email':
            return await this.sendEmail(args);
          case 'get_recent_emails':
            return await this.getRecentEmails(args);
          case 'get_email_content':
            return await this.getEmailContent(args);
          case 'setup_email_account':
            return await this.setupEmailAccount(args);
          case 'list_supported_providers':
            return await this.listSupportedProviders(args);
          case 'configure_email_server':
            return await this.configureEmailServer(args);
          case 'test_email_connection':
            return await this.testConnection(args);
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error.message}`
            }
          ]
        };
      }
    });
  }

  // 创建SMTP邮件传输器
  createSMTPTransporter() {
    try {
      if (process.env.EMAIL_SMTP_HOST || process.env.WECHAT_EMAIL_HOST) {
        const config = {
          host: process.env.EMAIL_SMTP_HOST || process.env.WECHAT_EMAIL_HOST,
          port: parseInt(process.env.EMAIL_SMTP_PORT || process.env.WECHAT_EMAIL_PORT) || 587,
          secure: (process.env.EMAIL_SMTP_SECURE || process.env.WECHAT_EMAIL_SECURE) !== 'false',
          auth: {
            user: process.env.EMAIL_USER || process.env.WECHAT_EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD || process.env.WECHAT_EMAIL_PASSWORD
          },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 30000
        };
        console.log('使用手动配置的SMTP设置:', { host: config.host, port: config.port, secure: config.secure });
        return nodemailer.createTransport(config);
      }

      const emailUser = process.env.EMAIL_USER || process.env.WECHAT_EMAIL_USER;
      const emailType = process.env.EMAIL_TYPE;
      
      if (!emailUser) {
        throw new Error('缺少邮箱用户名配置。请设置 EMAIL_USER 环境变量。');
      }

      const provider = this.detectEmailProvider(emailUser, emailType);
      if (!provider) {
        throw new Error(`无法识别邮箱类型: ${emailUser}。如果是企业邮箱，请设置 EMAIL_TYPE 环境变量（如: 'exmail' 代表腾讯企业邮箱）`);
      }

      const emailConfig = EMAIL_CONFIGS[provider];
      const config = {
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: {
          user: emailUser,
          pass: process.env.EMAIL_PASSWORD || process.env.WECHAT_EMAIL_PASSWORD
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      };

      if (!config.auth.pass) {
        throw new Error('缺少邮箱密码配置。请设置 EMAIL_PASSWORD 环境变量。');
      }

      console.log(`自动配置SMTP设置 - 邮箱类型: ${emailConfig.name}`, { host: config.host, port: config.port, secure: config.secure });
      return nodemailer.createTransport(config);
    } catch (error) {
      console.error('创建SMTP传输器失败:', error.message);
      throw error;
    }
  }

  // 创建IMAP连接配置（imapflow）
  // 魔改说明：使用 imapflow 替代老的 node-imap 库
  // imapflow 在 connect() 时会自动发送 IMAP ID 命令（RFC 2971）
  // 这解决了网易邮箱 "Unsafe Login" 的问题
  createIMAPConfig() {
    try {
      const emailUser = process.env.EMAIL_USER || process.env.WECHAT_EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD || process.env.WECHAT_EMAIL_PASSWORD;

      if (!emailUser) {
        throw new Error('缺少邮箱用户名配置。请设置 EMAIL_USER 环境变量。');
      }
      if (!emailPassword) {
        throw new Error('缺少邮箱密码配置。请设置 EMAIL_PASSWORD 环境变量。');
      }

      let host, port, secure;

      // 手动配置优先
      if (process.env.EMAIL_IMAP_HOST || process.env.WECHAT_EMAIL_HOST) {
        host = process.env.EMAIL_IMAP_HOST || process.env.WECHAT_EMAIL_HOST?.replace('smtp', 'imap');
        port = parseInt(process.env.EMAIL_IMAP_PORT) || 993;
        secure = process.env.EMAIL_IMAP_SECURE !== 'false';
        console.log('使用手动配置的IMAP设置(imapflow):', { host, port, secure });
      } else {
        // 自动配置
        const emailType = process.env.EMAIL_TYPE;
        const provider = this.detectEmailProvider(emailUser, emailType);
        if (!provider) {
          throw new Error(`无法识别邮箱类型: ${emailUser}。如果是企业邮箱，请设置 EMAIL_TYPE 环境变量`);
        }

        const emailConfig = EMAIL_CONFIGS[provider];
        host = emailConfig.imap.host;
        port = emailConfig.imap.port;
        secure = emailConfig.imap.secure;
        console.log(`自动配置IMAP设置(imapflow) - 邮箱类型: ${emailConfig.name}`, { host, port, secure });
      }

      // imapflow 配置
      // 关键：clientInfo 会在连接时自动作为 ID 命令发送给服务器
      const config = {
        host,
        port,
        secure,
        auth: {
          user: emailUser,
          pass: emailPassword
        },
        clientInfo: { ...IMAP_CLIENT_INFO },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        disableAutoIdle: true // 不需要 IDLE 监听
      };

      return config;
    } catch (error) {
      console.error('创建IMAP配置失败:', error.message);
      throw error;
    }
  }

  // 创建POP3连接
  createPOP3Connection() {
    try {
      if (process.env.EMAIL_POP3_HOST || process.env.WECHAT_EMAIL_HOST) {
        const config = {
          hostname: process.env.EMAIL_POP3_HOST || process.env.WECHAT_EMAIL_HOST?.replace('smtp', 'pop'),
          port: parseInt(process.env.EMAIL_POP3_PORT) || 995,
          tls: (process.env.EMAIL_POP3_SECURE !== 'false'),
          username: process.env.EMAIL_USER || process.env.WECHAT_EMAIL_USER,
          password: process.env.EMAIL_PASSWORD || process.env.WECHAT_EMAIL_PASSWORD
        };
        console.log('使用手动配置的POP3设置:', { hostname: config.hostname, port: config.port });
        return config;
      }

      const emailUser = process.env.EMAIL_USER || process.env.WECHAT_EMAIL_USER;
      const emailType = process.env.EMAIL_TYPE;
      
      if (!emailUser) {
        throw new Error('缺少邮箱用户名配置。请设置 EMAIL_USER 环境变量。');
      }

      const provider = this.detectEmailProvider(emailUser, emailType);
      if (!provider) {
        throw new Error(`无法识别邮箱类型: ${emailUser}。如果是企业邮箱，请设置 EMAIL_TYPE 环境变量`);
      }

      const emailConfig = EMAIL_CONFIGS[provider];
      const config = {
        hostname: emailConfig.pop3.host,
        port: emailConfig.pop3.port,
        tls: emailConfig.pop3.secure,
        username: emailUser,
        password: process.env.EMAIL_PASSWORD || process.env.WECHAT_EMAIL_PASSWORD
      };

      if (!config.password) {
        throw new Error('缺少邮箱密码配置。请设置 EMAIL_PASSWORD 环境变量。');
      }

      console.log(`自动配置POP3设置 - 邮箱类型: ${emailConfig.name}`, { hostname: config.hostname, port: config.port });
      return config;
    } catch (error) {
      console.error('创建POP3连接失败:', error.message);
      throw error;
    }
  }

  // 发送邮件
  async sendEmail(args) {
    const { to, cc, bcc, subject, text, html, attachments } = args;

    const transporter = this.createSMTPTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || process.env.WECHAT_EMAIL_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
      subject,
      text,
      html
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => {
        if (att.content) {
          return { filename: att.filename, content: att.content, encoding: 'base64' };
        } else if (att.path) {
          return { filename: att.filename, path: att.path };
        }
        return att;
      });
    }

    const result = await transporter.sendMail(mailOptions);

    return {
      content: [
        {
          type: 'text',
          text: `邮件发送成功！\n消息ID: ${result.messageId}\n收件人: ${Array.isArray(to) ? to.join(', ') : to}\n主题: ${subject}`
        }
      ]
    };
  }

  // 获取最近的邮件列表
  async getRecentEmails(args = {}) {
    const { limit = 20, days = 3 } = args;
    
    // 自动检测邮箱类型并选择最佳协议
    const email = process.env.EMAIL_USER || process.env.WECHAT_EMAIL_USER;
    const emailType = process.env.EMAIL_TYPE;
    
    if (email) {
      const provider = this.detectEmailProvider(email, emailType);
      if (provider && EMAIL_CONFIGS[provider]) {
        const config = EMAIL_CONFIGS[provider];
        console.log(`使用${config.name}的${config.usePOP3 ? 'POP3' : 'IMAP'}协议获取邮件`);
        if (config.usePOP3) {
          return this.getRecentEmailsPOP3(args);
        }
      }
    }
    
    // 默认尝试IMAP，失败则尝试POP3
    try {
      return await this.getRecentEmailsIMAP(args);
    } catch (error) {
      console.log('IMAP失败，尝试POP3:', error.message);
      return this.getRecentEmailsPOP3(args);
    }
  }

  // 使用IMAP获取邮件列表（imapflow 版本）
  async getRecentEmailsIMAP(args = {}) {
    const { limit = 20, days = 3 } = args;
    
    const config = this.createIMAPConfig();
    const client = new ImapFlow(config);

    try {
      // 连接并自动发送 ID 命令
      await client.connect();
      console.log('IMAP连接成功，服务器信息:', client.serverInfo);

      // 打开收件箱（只读）
      const lock = await client.getMailboxLock('INBOX');
      let emails = [];

      try {
        // 搜索所有邮件
        const allUids = await client.search({ all: true });
        
        if (!allUids || allUids.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `最近${days}天内没有找到邮件。`
            }]
          };
        }

        // 取最近的邮件（UID 通常按时间递增）
        const recentUids = allUids.slice(-Math.min(limit * 3, allUids.length));

        // 批量获取邮件头部信息
        // search 返回的是 sequence number，直接传 number[] 即可
        const messages = await client.fetchAll(recentUids, {
          uid: true,
          envelope: true,
          internalDate: true
        });

        // 计算日期范围
        const since = new Date();
        since.setDate(since.getDate() - days);

        for (const msg of messages) {
          const env = msg.envelope || {};
          const emailDate = msg.internalDate ? new Date(msg.internalDate) : null;
          
          if (emailDate && emailDate >= since) {
            emails.push({
              uid: msg.uid,
              date: emailDate.toLocaleString(),
              from: env.from?.map(f => `${f.name || ''} <${f.address}>`).join(', ') || '未知',
              to: env.to?.map(t => `${t.name || ''} <${t.address}>`).join(', ') || '未知',
              subject: env.subject || '(无主题)'
            });
          }
        }
      } finally {
        // 释放邮箱锁
        lock.release();
      }

      // 按日期排序（最新的在前）
      emails.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // 限制结果数量
      const limitedEmails = emails.slice(0, limit);

      if (limitedEmails.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `最近${days}天内没有找到邮件。`
          }]
        };
      }

      const emailList = limitedEmails.map(email => 
        `📧 UID: ${email.uid}\n` +
        `📅 日期: ${email.date}\n` +
        `👤 发件人: ${email.from}\n` +
        `📝 主题: ${email.subject}\n` +
        `────────────────────────────────`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `📬 最近${days}天的邮件列表 (共${limitedEmails.length}封，IMAP/imapflow):\n\n${emailList}`
        }]
      };
    } finally {
      // 确保关闭连接
      try {
        await client.logout();
      } catch (e) {
        client.close();
      }
    }
  }

  // 使用POP3获取邮件列表
  async getRecentEmailsPOP3(args = {}) {
    const { limit = 20, days = 3 } = args;
    
    return new Promise((resolve, reject) => {
      const config = this.createPOP3Connection();
      const pop3 = new POP3Client(config.port, config.hostname, {
        enabletls: config.tls,
        debug: false
      });

      let emails = [];
      let messageCount = 0;

      pop3.on('connect', () => {
        pop3.login(config.username, config.password);
      });

      pop3.on('login', (status, data) => {
        if (status) {
          pop3.list();
        } else {
          reject(new Error('POP3登录失败: ' + data));
        }
      });

      pop3.on('list', (status, msgcount, msgnumber, data) => {
        if (status) {
          messageCount = msgcount;
          if (msgcount === 0) {
            pop3.quit();
            resolve({
              content: [{ type: 'text', text: '邮箱中没有邮件。' }]
            });
            return;
          }

          const startMsg = Math.max(1, msgcount - limit + 1);
          const endMsg = msgcount;
          
          for (let i = endMsg; i >= startMsg; i--) {
            pop3.retr(i);
          }
        } else {
          reject(new Error('获取邮件列表失败: ' + data));
        }
      });

      pop3.on('retr', (status, msgnumber, data) => {
        if (status) {
          simpleParser(data, (err, parsed) => {
            if (!err) {
              const since = new Date();
              since.setDate(since.getDate() - days);
              
              const emailDate = new Date(parsed.date);
              if (emailDate >= since) {
                emails.push({
                  uid: msgnumber,
                  date: parsed.date ? parsed.date.toLocaleString() : '未知',
                  from: parsed.from?.text || '未知',
                  to: parsed.to?.text || '未知',
                  subject: parsed.subject || '(无主题)'
                });
              }
            }

            if (emails.length > 0 || msgnumber === Math.max(1, messageCount - limit + 1)) {
              pop3.quit();
            }
          });
        } else {
          reject(new Error(`获取邮件${msgnumber}失败: ${data}`));
        }
      });

      pop3.on('quit', (status, data) => {
        emails.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (emails.length === 0) {
          resolve({
            content: [{ type: 'text', text: `最近${days}天内没有找到邮件。` }]
          });
          return;
        }

        const emailList = emails.map(email => 
          `📧 邮件号: ${email.uid}\n` +
          `📅 日期: ${email.date}\n` +
          `👤 发件人: ${email.from}\n` +
          `📝 主题: ${email.subject}\n` +
          `────────────────────────────────`
        ).join('\n');

        resolve({
          content: [{
            type: 'text',
            text: `📬 最近${days}天的邮件列表 (共${emails.length}封，POP3协议):\n\n${emailList}`
          }]
        });
      });

      pop3.on('error', (err) => {
        reject(new Error('POP3连接错误: ' + err.message));
      });
    });
  }

  // 获取指定邮件内容（imapflow 版本）
  async getEmailContent(args) {
    const { uid } = args;

    const config = this.createIMAPConfig();
    const client = new ImapFlow(config);

    try {
      // 连接并自动发送 ID 命令
      await client.connect();
      console.log('IMAP连接成功(获取邮件内容)，服务器信息:', client.serverInfo);

      // 打开收件箱
      const lock = await client.getMailboxLock('INBOX');

      try {
        // 下载完整邮件（RFC822）
        // imapflow 的 download 返回 { meta, content }，content 是 Readable stream
        // 注意：download 默认用 sequence number，必须通过 options.uid=true 指定使用 UID
        const { meta, content } = await client.download(uid.toString(), undefined, { uid: true });

        if (!content) {
          throw new Error(`未找到 UID 为 ${uid} 的邮件`);
        }

        // 将 stream 转换为 buffer，然后用 simpleParser 解析
        const chunks = [];
        for await (const chunk of content) {
          chunks.push(chunk);
        }
        const rawEmail = Buffer.concat(chunks);

        const parsed = await simpleParser(rawEmail);

        let contentText = `📧 邮件详情 (UID: ${uid})\n`;
        contentText += `────────────────────────────────\n`;
        contentText += `📅 日期: ${parsed.date || '未知'}\n`;
        contentText += `👤 发件人: ${parsed.from?.text || '未知'}\n`;
        contentText += `👥 收件人: ${parsed.to?.text || '未知'}\n`;
        
        if (parsed.cc) {
          contentText += `📋 抄送: ${parsed.cc.text}\n`;
        }
        
        contentText += `📝 主题: ${parsed.subject || '(无主题)'}\n`;
        contentText += `────────────────────────────────\n`;
        
        // 邮件内容
        if (parsed.text) {
          contentText += `📄 文本内容:\n${parsed.text}\n`;
        }
        
        if (parsed.html && parsed.html !== parsed.text) {
          contentText += `🌐 HTML内容:\n${parsed.html}\n`;
        }

        // 附件信息
        if (parsed.attachments && parsed.attachments.length > 0) {
          contentText += `📎 附件列表:\n`;
          parsed.attachments.forEach((att, index) => {
            contentText += `  ${index + 1}. ${att.filename || '未命名'} (${att.size || 0} bytes)\n`;
          });
        }

        return {
          content: [{
            type: 'text',
            text: contentText
          }]
        };
      } finally {
        lock.release();
      }
    } finally {
      try {
        await client.logout();
      } catch (e) {
        client.close();
      }
    }
  }

  // 设置邮箱账号（自动配置）
  async setupEmailAccount(args) {
    const { email, password, provider } = args;

    process.env.EMAIL_USER = email;
    process.env.EMAIL_PASSWORD = password;

    let detectedProvider = provider;
    let config;

    try {
      if (!detectedProvider) {
        detectedProvider = this.detectEmailProvider(email);
        if (!detectedProvider) {
          return {
            content: [{
              type: 'text',
              text: `❌ 无法识别邮箱类型: ${email}\n\n支持的邮箱类型请使用 list_supported_providers 查看，或手动指定 provider 参数。`
            }]
          };
        }
      }

      config = this.autoConfigureByProvider(detectedProvider);

      let result = `✅ 邮箱账号设置成功！(魔改版 - imapflow)\n\n`;
      result += `📧 邮箱地址: ${email}\n`;
      result += `🏢 邮箱提供商: ${config.name}\n`;
      result += `📤 SMTP服务器: ${config.smtp.host}:${config.smtp.port} (SSL: ${config.smtp.secure})\n`;
      result += `📥 接收协议: ${config.usePOP3 ? 'POP3' : 'IMAP (imapflow + ID命令)'}\n`;
      
      if (config.usePOP3) {
        result += `📥 POP3服务器: ${config.pop3.host}:${config.pop3.port} (SSL: ${config.pop3.secure})\n`;
      } else {
        result += `📥 IMAP服务器: ${config.imap.host}:${config.imap.port} (SSL: ${config.imap.secure})\n`;
      }

      result += `\n💡 提示: 配置已自动完成，您现在可以使用邮件功能了！`;

      return {
        content: [{ type: 'text', text: result }]
      };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ 邮箱设置失败: ${error.message}` }]
      };
    }
  }

  // 列出支持的邮箱提供商
  async listSupportedProviders() {
    let result = `📋 支持的邮箱提供商 (魔改版 - imapflow):\n\n`;
    
    for (const [provider, config] of Object.entries(EMAIL_CONFIGS)) {
      result += `🏢 ${config.name} (${provider})\n`;
      result += `   域名: ${config.domains.join(', ')}\n`;
      result += `   推荐协议: ${config.usePOP3 ? 'POP3' : 'IMAP (imapflow)'}\n`;
      result += `   示例: user@${config.domains[0]}\n\n`;
    }

    result += `💡 使用方法:\n`;
    result += `1. 使用 setup_email_account 工具\n`;
    result += `2. 填写完整邮箱地址和密码/授权码\n`;
    result += `3. 系统会自动识别并配置对应的邮箱服务器\n\n`;
    result += `🔧 魔改说明:\n`;
    result += `- 使用 imapflow 替代老的 node-imap 库\n`;
    result += `- 自动发送 IMAP ID 命令 (RFC 2971)\n`;
    result += `- 解决网易邮箱 "Unsafe Login" 问题\n\n`;
    result += `⚠️  注意: 请确保已在对应邮箱中开启POP3/IMAP/SMTP服务并获取授权码！`;

    return {
      content: [{ type: 'text', text: result }]
    };
  }

  // 配置邮箱服务器
  async configureEmailServer(args) {
    const { smtpHost, smtpPort, smtpSecure, imapHost, imapPort, imapSecure, user, password } = args;

    if (smtpHost) process.env.EMAIL_SMTP_HOST = smtpHost;
    if (smtpPort) process.env.EMAIL_SMTP_PORT = smtpPort.toString();
    if (smtpSecure !== undefined) process.env.EMAIL_SMTP_SECURE = smtpSecure.toString();
    if (imapHost) process.env.EMAIL_IMAP_HOST = imapHost;
    if (imapPort) process.env.EMAIL_IMAP_PORT = imapPort.toString();
    if (imapSecure !== undefined) process.env.EMAIL_IMAP_SECURE = imapSecure.toString();
    if (user) process.env.EMAIL_USER = user;
    if (password) process.env.EMAIL_PASSWORD = password;

    let configInfo = '邮箱配置已更新：\n';
    configInfo += `SMTP服务器: ${process.env.EMAIL_SMTP_HOST || '未设置'}\n`;
    configInfo += `SMTP端口: ${process.env.EMAIL_SMTP_PORT || '未设置'}\n`;
    configInfo += `SMTP SSL: ${process.env.EMAIL_SMTP_SECURE || '未设置'}\n`;
    configInfo += `IMAP服务器: ${process.env.EMAIL_IMAP_HOST || '未设置'}\n`;
    configInfo += `IMAP端口: ${process.env.EMAIL_IMAP_PORT || '未设置'}\n`;
    configInfo += `IMAP SSL: ${process.env.EMAIL_IMAP_SECURE || '未设置'}\n`;
    configInfo += `用户: ${user || '未更新'}`;

    return {
      content: [{ type: 'text', text: configInfo }]
    };
  }

  // 测试连接
  async testConnection(args = {}) {
    const { testType = 'both' } = args;
    let results = [];

    try {
      // 测试SMTP连接
      if (testType === 'smtp' || testType === 'both') {
        try {
          const transporter = this.createSMTPTransporter();
          await transporter.verify();
          results.push('✅ SMTP服务器连接测试成功！');
        } catch (error) {
          results.push(`❌ SMTP连接测试失败: ${error.message}`);
        }
      }

      // 测试IMAP连接（imapflow 版本）
      if (testType === 'imap' || testType === 'both') {
        try {
          const config = this.createIMAPConfig();
          const client = new ImapFlow(config);
          
          try {
            await client.connect();
            console.log('IMAP连接测试成功，服务器信息:', client.serverInfo);
            results.push('✅ IMAP服务器连接测试成功！(imapflow + ID命令)');
            if (client.serverInfo) {
              results.push(`   服务器标识: ${JSON.stringify(client.serverInfo)}`);
            }
          } finally {
            try {
              await client.logout();
            } catch (e) {
              client.close();
            }
          }
        } catch (error) {
          results.push(`❌ IMAP连接测试失败: ${error.message}`);
        }
      }

      return {
        content: [{ type: 'text', text: results.join('\n') }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ 测试失败: ${error.message}` }]
      };
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('通用邮件MCP服务器已启动 (魔改版 - imapflow)');
    } catch (error) {
      console.error('MCP服务器启动失败:', error.message);
      throw error;
    }
  }
}

// 导出类供测试使用
export { UniversalEmailMCPServer };

// 如果直接运行此文件，启动服务器
if (import.meta.url.endsWith(process.argv[1]) || import.meta.url.includes('index.js')) {
  const server = new UniversalEmailMCPServer();
  server.run().catch(console.error);
}
