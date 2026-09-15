# 📧 email-mcp-pro

通用邮箱 MCP 服务器 — 基于 [imapflow](https://github.com/postalsys/imapflow) 重写 IMAP 实现，支持 **IMAP ID 命令 (RFC 2971)**，完美兼容网易邮箱系列。

> ✨ **核心改进**：原版 `email-mcp` 使用老的 `node-imap` 库，不支持 IMAP ID 命令，导致网易邮箱 (163/126/yeah) 读取邮件内容时报 `EXAMINE Unsafe Login` 错误。本版本改用 `imapflow`，在连接时自动发送 ID 命令声明客户端身份，彻底解决该问题。

## ✨ 功能特性

- 📤 **邮件发送**：支持 HTML 和纯文本邮件、多收件人、抄送、密送、附件
- 📥 **邮件列表**：获取最近 N 天的邮件列表（IMAP / POP3 双协议）
- 📖 **邮件内容**：读取指定邮件的完整内容（文本、HTML、附件信息）
- 🔧 **动态配置**：支持运行时配置邮箱服务器，自动识别邮箱类型
- 🔍 **连接测试**：内置 SMTP / IMAP 服务器连接测试
- 🛡️ **IMAP ID 命令**：自动发送 RFC 2971 ID 命令，兼容网易邮箱安全策略
- ⚡ **现代 IMAP 库**：基于 imapflow，Promise/async 风格 API，更稳定可靠

## 📦 支持的邮箱服务商

| 邮箱类型 | SMTP | IMAP | POP3 | 备注 |
|---------|------|------|------|------|
| QQ邮箱 | ✅ | ✅ | ✅ | |
| **网易邮箱 (163/126/yeah)** | ✅ | ✅ | ✅ | **IMAP ID 命令已修复** |
| Gmail | ✅ | ✅ | ✅ | 需应用专用密码 |
| Outlook/Hotmail | ✅ | ✅ | ✅ | |
| 腾讯企业邮箱 | ✅ | ✅ | ✅ | |
| 阿里云邮箱 | ✅ | ✅ | ✅ | |
| 新浪邮箱 | ✅ | ✅ | ✅ | |
| 搜狐邮箱 | ✅ | ✅ | ✅ | |

## 🚀 快速开始

### 方式一：npx 直接运行（推荐）

无需安装，直接通过 npx 运行：

```bash
npx email-mcp-pro
```

在 MCP 客户端配置中使用：

```json
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["-y", "email-mcp-pro"],
      "env": {
        "EMAIL_USER": "your-email@163.com",
        "EMAIL_PASSWORD": "your-auth-code",
        "EMAIL_TYPE": "auto"
      }
    }
  }
}
```

### 方式二：全局安装

```bash
npm install -g email-mcp-pro
email-mcp-pro
```

### 方式三：从源码运行

```bash
git clone https://github.com/batsama/email-mcp-pro.git
cd email-mcp-pro
npm install
EMAIL_USER=your-email@163.com EMAIL_PASSWORD=your-auth-code node index.js
```

## 🔧 配置说明

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `EMAIL_USER` | ✅ | 邮箱地址 |
| `EMAIL_PASSWORD` | ✅ | 邮箱密码或客户端授权码 |
| `EMAIL_TYPE` | 可选 | 邮箱类型：`auto`(默认)、`qq`、`163`、`gmail`、`outlook`、`exmail`、`aliyun`、`sina`、`sohu` |

也可以通过 MCP 工具 `setup_email_account` 在运行时动态配置。

### 网易邮箱配置指南

1. 登录 [163 邮箱](https://mail.163.com)
2. 进入「设置」→「POP3/SMTP/IMAP」
3. 开启「IMAP/SMTP服务」和「POP3/SMTP服务」
4. 生成**客户端授权密码**（注意：不是登录密码）
5. 使用授权码作为 `EMAIL_PASSWORD`

## 🛠️ MCP 工具说明

### 1. `send_email` — 发送邮件

```json
{
  "to": ["recipient@example.com"],
  "subject": "测试邮件",
  "text": "这是一封测试邮件",
  "html": "<h1>测试邮件</h1><p>Hello World</p>"
}
```

### 2. `get_recent_emails` — 获取最近邮件列表

```json
{
  "limit": 10,
  "days": 3
}
```

### 3. `get_email_content` — 获取邮件详情

```json
{
  "uid": "1623676463"
}
```

### 4. `setup_email_account` — 设置邮箱账号

```json
{
  "email": "user@163.com",
  "password": "your-auth-code",
  "provider": "163"
}
```

### 5. `test_email_connection` — 测试连接

```json
{
  "testType": "both"
}
```

### 6. `list_supported_providers` — 列出支持的邮箱

### 7. `configure_email_server` — 手动配置服务器（高级）

## 🔧 本地测试

```bash
# 测试 IMAP 连接（含 ID 命令验证）
EMAIL_USER=your-email@163.com EMAIL_PASSWORD=your-auth-code node test-imapflow.js
```

## 📝 与原版 email-mcp 的区别

| 特性 | 原版 email-mcp | email-mcp-pro |
|------|---------------|---------------|
| IMAP 库 | node-imap (已停止维护) | imapflow (活跃维护) |
| IMAP ID 命令 (RFC 2971) | ❌ 不支持 | ✅ 自动发送 |
| 网易邮箱 IMAP 读取邮件 | ❌ `Unsafe Login` 错误 | ✅ 正常工作 |
| 网易邮箱默认协议 | POP3 (规避方案) | IMAP (原生支持) |
| API 风格 | 事件驱动 (Callback) | Promise/async |
| 代码可维护性 | 较低 | 较高 |

## 📄 License

MIT License
