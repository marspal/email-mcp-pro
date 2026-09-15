# 📦 NPM 发布指南

这个文档描述了如何将 `universal-email-mcp-server` 发布到 npm。

## 🔧 发布前准备

### 1. 确保你有 npm 账号
```bash
# 登录 npm
npm login
```

### 2. 检查当前版本
```bash
# 查看当前版本
npm version

# 查看 npm 上已发布的版本
npm view universal-email-mcp-server versions --json
```

### 3. 更新版本号
```bash
# 增加补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 增加次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 增加主要版本 (1.0.0 -> 2.0.0)
npm version major
```

## 🚀 发布步骤

### 1. 运行发布前检查
```bash
npm run publish-check
```

### 2. 发布到 npm
```bash
# 发布到 npm (公开包)
npm publish

# 如果包名已存在，可能需要使用作用域
npm publish --access public
```

### 3. 验证发布
```bash
# 检查包是否发布成功
npm view universal-email-mcp-server

# 安装测试
npm install universal-email-mcp-server
```

## 📝 发布注意事项

### 版本管理
- 遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范
- 补丁版本：bug修复
- 次要版本：新功能，向后兼容
- 主要版本：破坏性变更

### 发布内容
包含的文件（在 package.json 的 `files` 字段中定义）：
- `index.js` - 主程序文件
- `README.md` - 使用说明
- `CONFIG_GUIDE.md` - 配置指南
- `LICENSE` - 开源协议

不包含的文件（通过 `.npmignore` 排除）：
- 测试文件 (`test-*.js`)
- 配置文件 (`.env`, `mcp-x_config_v2.json`)
- 开发文件

### 自动化检查
`prepublishOnly` 脚本会在发布前自动运行：
- 检查必要文件是否存在
- 验证 package.json 配置
- 检查版本号格式

## 🔍 发布后验证

### 1. 检查包信息
```bash
npm info universal-email-mcp-server
```

### 2. 测试安装
```bash
# 创建临时目录测试
mkdir test-install && cd test-install
npm init -y
npm install universal-email-mcp-server
node -e "import('universal-email-mcp-server').then(console.log)"
```

### 3. 测试 CLI 工具
```bash
# 如果包含 bin 脚本
npx universal-email-mcp --help
```

## 🔧 故障排除

### 常见错误

1. **包名已存在**
   ```
   npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/universal-email-mcp-server
   ```
   解决：更改包名或使用作用域 `@username/universal-email-mcp-server`

2. **权限不足**
   ```
   npm ERR! code E403
   ```
   解决：确保已登录 `npm login`

3. **版本号冲突**
   ```
   npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/universal-email-mcp-server
   ```
   解决：更新版本号 `npm version patch`

### 撤销发布
```bash
# 撤销指定版本（仅限发布后24小时内）
npm unpublish universal-email-mcp-server@1.0.0

# 撤销整个包（仅限发布后24小时内）
npm unpublish universal-email-mcp-server --force
```

## 📊 发布后管理

### 1. 监控下载量
- 访问 [npm 包页面](https://www.npmjs.com/package/universal-email-mcp-server)
- 使用 [npm-stat](https://npm-stat.com/) 查看统计

### 2. 维护更新
- 定期更新依赖 `npm update`
- 修复安全漏洞 `npm audit fix`
- 发布补丁版本

### 3. 社区支持
- 及时回应 GitHub Issues
- 更新文档
- 发布更新日志

## 🎯 最佳实践

1. **发布前测试**：确保所有功能正常工作
2. **文档更新**：保持 README 和配置指南最新
3. **版本规范**：严格遵循语义化版本
4. **安全检查**：不要泄露敏感信息
5. **持续维护**：定期更新和修复问题 