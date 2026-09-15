#!/usr/bin/env node

import { UniversalEmailMCPServer } from './index.js';

async function testAutoConfig() {
  console.log('🚀 测试邮箱自动配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 测试1: 列出支持的邮箱提供商
    console.log('📋 测试1: 列出支持的邮箱提供商');
    console.log('─────────────────────────────────');
    const providersResult = await server.listSupportedProviders();
    console.log(providersResult.content[0].text);
    console.log();

    // 测试2: 自动配置163邮箱
    console.log('📋 测试2: 自动配置163邮箱');
    console.log('─────────────────────────────────');
    const setup163Result = await server.setupEmailAccount({
      email: 'ganyizhi520@163.com',
      password: ''
    });
    console.log(setup163Result.content[0].text);
    console.log();

    // 测试3: 连接测试
    console.log('📋 测试3: 连接测试');
    console.log('─────────────────────────────────');
    const testResult = await server.testConnection({ testType: 'smtp' });
    console.log(testResult.content[0].text);
    console.log();

    // 测试4: 发送邮件
    console.log('📋 测试4: 发送测试邮件');
    console.log('─────────────────────────────────');
    const sendResult = await server.sendEmail({
      to: ['229637012@qq.com'],
      subject: '自动配置功能测试',
      text: '这是自动配置功能的测试邮件！\n\n系统已自动识别163邮箱并配置了相应的服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
    });
    console.log(sendResult.content[0].text);
    console.log();

    // 测试5: 获取邮件列表
    console.log('📋 测试5: 获取邮件列表');
    console.log('─────────────────────────────────');
    const emailsResult = await server.getRecentEmails({ limit: 3, days: 7 });
    console.log(emailsResult.content[0].text);
    console.log();

    console.log('✅ 自动配置功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 测试QQ邮箱自动配置
async function testQQAutoConfig() {
  console.log('\n🚀 测试QQ邮箱自动配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置QQ邮箱
    console.log('📋 自动配置QQ邮箱');
    console.log('─────────────────────────────────');
    const setupQQResult = await server.setupEmailAccount({
      email: '229637012@qq.com',
      password: ''  // QQ邮箱授权码
    });
    console.log(setupQQResult.content[0].text);
    console.log();

    // 连接测试
    console.log('📋 QQ邮箱连接测试');
    console.log('─────────────────────────────────');
    const testResult = await server.testConnection({ testType: 'both' });
    console.log(testResult.content[0].text);
    console.log();

    // 发送测试邮件
    console.log('📋 QQ邮箱发送测试邮件');
    console.log('─────────────────────────────────');
    const sendResult = await server.sendEmail({
      to: ['ganyizhi520@163.com'],
      subject: 'QQ邮箱自动配置测试',
      text: '这是QQ邮箱自动配置功能的测试邮件！\n\n系统已自动识别QQ邮箱并配置了相应的服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
    });
    console.log(sendResult.content[0].text);
    console.log();

    console.log('✅ QQ邮箱自动配置测试完成！');

  } catch (error) {
    console.error('❌ QQ邮箱测试失败:', error.message);
  }
}

// 测试腾讯企业邮箱自动配置
async function testTencentEnterpriseConfig() {
  console.log('\n🚀 测试腾讯企业邮箱配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置腾讯企业邮箱
    console.log('📋 配置腾讯企业邮箱 (使用exmail类型)');
    console.log('─────────────────────────────────');
    const setupResult = await server.setupEmailAccount({
      email: 'user@company.com',  // 示例企业邮箱地址
      password: 'your-enterprise-auth-code',  // 需要实际的企业邮箱授权码
      provider: 'exmail'  // 手动指定为腾讯企业邮箱
    });
    console.log(setupResult.content[0].text);
    console.log();

    // 检测邮箱类型
    console.log('📋 验证邮箱类型检测');
    console.log('─────────────────────────────────');
    const provider = server.detectEmailProvider('user@company.com', 'exmail');
    console.log(`检测到的邮箱类型: ${provider}`);
    if (provider === 'exmail') {
      console.log('✅ 企业邮箱类型检测正确');
    } else {
      console.log('❌ 企业邮箱类型检测失败');
    }
    console.log();

    // 连接测试 (这里会因为没有真实授权码而失败，但能看到配置是否正确)
    console.log('📋 腾讯企业邮箱连接测试');
    console.log('─────────────────────────────────');
    try {
      const testResult = await server.testConnection({ testType: 'smtp' });
      console.log(testResult.content[0].text);
      
      // 如果连接成功，发送测试邮件
      console.log('📋 腾讯企业邮箱发送测试邮件');
      console.log('─────────────────────────────────');
      const sendResult = await server.sendEmail({
        to: ['229637012@qq.com'],
        subject: '腾讯企业邮箱配置测试',
        text: '这是腾讯企业邮箱配置功能的测试邮件！\n\n系统已配置腾讯企业邮箱服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
      });
      console.log(sendResult.content[0].text);
      console.log();
    } catch (error) {
      console.log(`连接测试结果: ${error.message}`);
      console.log('💡 提示: 这是预期的，因为使用的是示例授权码');
    }
    console.log();

    console.log('✅ 腾讯企业邮箱配置测试完成！');

  } catch (error) {
    console.error('❌ 腾讯企业邮箱测试失败:', error.message);
  }
}

// 测试网易企业邮箱自动配置
async function testNeteaseEnterpriseConfig() {
  console.log('\n🚀 测试网易企业邮箱配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置网易企业邮箱
    console.log('📋 配置网易企业邮箱 (使用netease-enterprise类型)');
    console.log('─────────────────────────────────');
    const setupResult = await server.setupEmailAccount({
      email: 'ganyizhi@mimamojp.com',  // 示例企业邮箱地址
      password: '1qaz!QAZ',  // 需要实际的网易企业邮箱授权码
      provider: 'netease-enterprise'  // 手动指定为网易企业邮箱
    });
    console.log(setupResult.content[0].text);
    console.log();

    // 检测邮箱类型
    console.log('📋 验证邮箱类型检测');
    console.log('─────────────────────────────────');
    const provider = server.detectEmailProvider('user@enterprise.com', 'netease-enterprise');
    console.log(`检测到的邮箱类型: ${provider}`);
    if (provider === 'netease-enterprise') {
      console.log('✅ 网易企业邮箱类型检测正确');
    } else {
      console.log('❌ 网易企业邮箱类型检测失败');
    }
    console.log();

    // 连接测试
    console.log('📋 网易企业邮箱连接测试');
    console.log('─────────────────────────────────');
    try {
      const testResult = await server.testConnection({ testType: 'smtp' });
      console.log(testResult.content[0].text);
      
      // 如果连接成功，发送测试邮件
      console.log('📋 网易企业邮箱发送测试邮件');
      console.log('─────────────────────────────────');
      const sendResult = await server.sendEmail({
        to: ['229637012@qq.com'],
        subject: '网易企业邮箱配置测试',
        text: '这是网易企业邮箱配置功能的测试邮件！\n\n系统已配置网易企业邮箱服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
      });
      console.log(sendResult.content[0].text);
      console.log();
    } catch (error) {
      console.log(`连接测试结果: ${error.message}`);
      console.log('💡 提示: 这是预期的，因为使用的是示例授权码');
    }
    console.log();

    console.log('✅ 网易企业邮箱配置测试完成！');

  } catch (error) {
    console.error('❌ 网易企业邮箱测试失败:', error.message);
  }
}

// 测试企业邮箱场景对比
async function testEnterpriseEmailComparison() {
  console.log('\n🚀 企业邮箱配置对比测试\n');

  const server = new UniversalEmailMCPServer();

  console.log('📋 企业邮箱vs个人邮箱配置对比');
  console.log('═════════════════════════════════');

  // 测试场景1: 企业域名但腾讯企业邮箱服务
  console.log('\n1️⃣  企业域名 + 腾讯企业邮箱服务');
  console.log('   邮箱: user@mycompany.com');
  console.log('   服务: 腾讯企业邮箱 (smtp.exmail.qq.com)');
  console.log('   配置: EMAIL_TYPE="exmail"');
  
  const provider1 = server.detectEmailProvider('user@mycompany.com', 'exmail');
  console.log(`   检测结果: ${provider1}`);
  
  // 测试场景2: 企业域名但网易企业邮箱服务
  console.log('\n2️⃣  企业域名 + 网易企业邮箱服务');
  console.log('   邮箱: user@myenterprise.com');
  console.log('   服务: 网易企业邮箱 (smtphz.qiye.163.com)');
  console.log('   配置: EMAIL_TYPE="netease-enterprise"');
  
  const provider2 = server.detectEmailProvider('user@myenterprise.com', 'netease-enterprise');
  console.log(`   检测结果: ${provider2}`);

  // 测试场景3: 个人邮箱自动检测
  console.log('\n3️⃣  个人邮箱自动检测');
  console.log('   邮箱: user@qq.com');
  console.log('   配置: EMAIL_TYPE="auto" 或不设置');
  
  const provider3 = server.detectEmailProvider('user@qq.com');
  console.log(`   检测结果: ${provider3}`);

  console.log('\n💡 重要提示:');
  console.log('   - 企业邮箱必须手动设置 EMAIL_TYPE 字段');
  console.log('   - 个人邮箱可以自动检测配置');
  console.log('   - 企业邮箱的域名和实际服务器通常不同');
  
  console.log('\n✅ 企业邮箱对比测试完成！');
}

// 测试Gmail邮箱自动配置
async function testGmailConfig() {
  console.log('\n🚀 测试Gmail邮箱配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置Gmail邮箱
    console.log('📋 配置Gmail邮箱');
    console.log('─────────────────────────────────');
    const setupResult = await server.setupEmailAccount({
      email: 'rz851a@gmail.com',  // 示例Gmail地址
      password: 'feqfotokepvwzdoi',  // 需要使用应用专用密码
      provider: 'gmail'  // 手动指定为Gmail
    });
    console.log(setupResult.content[0].text);
    console.log();

    // 检测邮箱类型
    console.log('📋 验证Gmail类型检测');
    console.log('─────────────────────────────────');
    const provider = server.detectEmailProvider('user@gmail.com', 'gmail');
    console.log(`检测到的邮箱类型: ${provider}`);
    if (provider === 'gmail') {
      console.log('✅ Gmail类型检测正确');
    } else {
      console.log('❌ Gmail类型检测失败');
    }
    console.log();

    // 连接测试
    console.log('📋 Gmail连接测试');
    console.log('─────────────────────────────────');
    try {
      const testResult = await server.testConnection({ testType: 'smtp' });
      console.log(testResult.content[0].text);
      
      // 如果连接成功，发送测试邮件
      console.log('📋 Gmail发送测试邮件');
      console.log('─────────────────────────────────');
      const sendResult = await server.sendEmail({
        to: ['229637012@qq.com'],
        subject: 'Gmail配置测试',
        text: '这是Gmail配置功能的测试邮件！\n\n系统已配置Gmail服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
      });
      console.log(sendResult.content[0].text);
      console.log();
    } catch (error) {
      console.log(`连接测试结果: ${error.message}`);
      console.log('💡 提示: Gmail需要应用专用密码，从2025年5月1日起需要OAuth');
    }
    console.log();

    console.log('✅ Gmail配置测试完成！');

  } catch (error) {
    console.error('❌ Gmail测试失败:', error.message);
  }
}

// 测试Outlook/Hotmail邮箱自动配置
async function testOutlookConfig() {
  console.log('\n🚀 测试Outlook/Hotmail邮箱配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置Outlook邮箱
    console.log('📋 配置Outlook/Hotmail邮箱');
    console.log('─────────────────────────────────');
    const setupResult = await server.setupEmailAccount({
      email: 'user@outlook.com',  // 示例Outlook地址
      password: 'your-password',  // 需要实际的密码
      provider: 'outlook'  // 手动指定为Outlook
    });
    console.log(setupResult.content[0].text);
    console.log();

    // 测试Hotmail域名检测
    console.log('📋 验证Hotmail域名检测');
    console.log('─────────────────────────────────');
    const hotmailProvider = server.detectEmailProvider('user@hotmail.com');
    console.log(`Hotmail检测结果: ${hotmailProvider}`);
    
    const liveProvider = server.detectEmailProvider('user@live.com');
    console.log(`Live检测结果: ${liveProvider}`);
    
    if (hotmailProvider === 'outlook' && liveProvider === 'outlook') {
      console.log('✅ Outlook系列域名检测正确');
    } else {
      console.log('❌ Outlook系列域名检测失败');
    }
    console.log();

    // 连接测试
    console.log('📋 Outlook连接测试');
    console.log('─────────────────────────────────');
    try {
      const testResult = await server.testConnection({ testType: 'smtp' });
      console.log(testResult.content[0].text);
      
      // 如果连接成功，发送测试邮件
      console.log('📋 Outlook发送测试邮件');
      console.log('─────────────────────────────────');
      const sendResult = await server.sendEmail({
        to: ['229637012@qq.com'],
        subject: 'Outlook配置测试',
        text: '这是Outlook配置功能的测试邮件！\n\n系统已配置Outlook服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
      });
      console.log(sendResult.content[0].text);
      console.log();
    } catch (error) {
      console.log(`连接测试结果: ${error.message}`);
      console.log('💡 提示: 需要在Outlook.com设置中允许第三方应用访问');
    }
    console.log();

    console.log('✅ Outlook配置测试完成！');

  } catch (error) {
    console.error('❌ Outlook测试失败:', error.message);
  }
}

// 测试阿里云邮箱自动配置
async function testAliyunConfig() {
  console.log('\n🚀 测试阿里云邮箱配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置阿里云邮箱
    console.log('📋 配置阿里云邮箱');
    console.log('─────────────────────────────────');
    const setupResult = await server.setupEmailAccount({
      email: 'user@aliyun.com',  // 示例阿里云邮箱地址
      password: 'your-auth-code',  // 需要实际的授权码
      provider: 'aliyun'  // 手动指定为阿里云邮箱
    });
    console.log(setupResult.content[0].text);
    console.log();

    // 检测阿里云相关域名
    console.log('📋 验证阿里云邮箱域名检测');
    console.log('─────────────────────────────────');
    const aliyunProvider = server.detectEmailProvider('user@aliyun.com');
    console.log(`阿里云检测结果: ${aliyunProvider}`);
    
    const alibabaProvider = server.detectEmailProvider('user@alibaba-inc.com');
    console.log(`阿里巴巴检测结果: ${alibabaProvider}`);
    
    if (aliyunProvider === 'aliyun' && alibabaProvider === 'aliyun') {
      console.log('✅ 阿里云系列域名检测正确');
    } else {
      console.log('❌ 阿里云系列域名检测失败');
    }
    console.log();

    // 连接测试
    console.log('📋 阿里云邮箱连接测试');
    console.log('─────────────────────────────────');
    try {
      const testResult = await server.testConnection({ testType: 'smtp' });
      console.log(testResult.content[0].text);
      
      // 如果连接成功，发送测试邮件
      console.log('📋 阿里云邮箱发送测试邮件');
      console.log('─────────────────────────────────');
      const sendResult = await server.sendEmail({
        to: ['229637012@qq.com'],
        subject: '阿里云邮箱配置测试',
        text: '这是阿里云邮箱配置功能的测试邮件！\n\n系统已配置阿里云邮箱服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
      });
      console.log(sendResult.content[0].text);
      console.log();
    } catch (error) {
      console.log(`连接测试结果: ${error.message}`);
      console.log('💡 提示: 需要在阿里云邮箱设置中开启POP3/IMAP/SMTP服务');
    }
    console.log();

    console.log('✅ 阿里云邮箱配置测试完成！');

  } catch (error) {
    console.error('❌ 阿里云邮箱测试失败:', error.message);
  }
}

// 测试新浪邮箱自动配置
async function testSinaConfig() {
  console.log('\n🚀 测试新浪邮箱配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置新浪邮箱
    console.log('📋 配置新浪邮箱');
    console.log('─────────────────────────────────');
    const setupResult = await server.setupEmailAccount({
      email: 'user@sina.com',  // 示例新浪邮箱地址
      password: 'your-auth-code',  // 需要实际的授权码
      provider: 'sina'  // 手动指定为新浪邮箱
    });
    console.log(setupResult.content[0].text);
    console.log();

    // 检测新浪相关域名
    console.log('📋 验证新浪邮箱域名检测');
    console.log('─────────────────────────────────');
    const sinaProvider = server.detectEmailProvider('user@sina.com');
    console.log(`Sina.com检测结果: ${sinaProvider}`);
    
    const sinaCnProvider = server.detectEmailProvider('user@sina.cn');
    console.log(`Sina.cn检测结果: ${sinaCnProvider}`);
    
    if (sinaProvider === 'sina' && sinaCnProvider === 'sina') {
      console.log('✅ 新浪系列域名检测正确');
    } else {
      console.log('❌ 新浪系列域名检测失败');
    }
    console.log();

    // 连接测试
    console.log('📋 新浪邮箱连接测试');
    console.log('─────────────────────────────────');
    try {
      const testResult = await server.testConnection({ testType: 'smtp' });
      console.log(testResult.content[0].text);
      
      // 如果连接成功，发送测试邮件
      console.log('📋 新浪邮箱发送测试邮件');
      console.log('─────────────────────────────────');
      const sendResult = await server.sendEmail({
        to: ['229637012@qq.com'],
        subject: '新浪邮箱配置测试',
        text: '这是新浪邮箱配置功能的测试邮件！\n\n系统已配置新浪邮箱服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
      });
      console.log(sendResult.content[0].text);
      console.log();
    } catch (error) {
      console.log(`连接测试结果: ${error.message}`);
      console.log('💡 提示: 需要在新浪邮箱设置中开启客户端授权');
    }
    console.log();

    console.log('✅ 新浪邮箱配置测试完成！');

  } catch (error) {
    console.error('❌ 新浪邮箱测试失败:', error.message);
  }
}

// 测试搜狐邮箱自动配置
async function testSohuConfig() {
  console.log('\n🚀 测试搜狐邮箱配置功能\n');

  const server = new UniversalEmailMCPServer();

  try {
    // 自动配置搜狐邮箱
    console.log('📋 配置搜狐邮箱');
    console.log('─────────────────────────────────');
    const setupResult = await server.setupEmailAccount({
      email: 'user@sohu.com',  // 示例搜狐邮箱地址
      password: 'your-password',  // 需要实际的密码
      provider: 'sohu'  // 手动指定为搜狐邮箱
    });
    console.log(setupResult.content[0].text);
    console.log();

    // 检测搜狐域名
    console.log('📋 验证搜狐邮箱域名检测');
    console.log('─────────────────────────────────');
    const sohuProvider = server.detectEmailProvider('user@sohu.com');
    console.log(`搜狐检测结果: ${sohuProvider}`);
    
    if (sohuProvider === 'sohu') {
      console.log('✅ 搜狐邮箱域名检测正确');
    } else {
      console.log('❌ 搜狐邮箱域名检测失败');
    }
    console.log();

    // 连接测试
    console.log('📋 搜狐邮箱连接测试');
    console.log('─────────────────────────────────');
    try {
      const testResult = await server.testConnection({ testType: 'smtp' });
      console.log(testResult.content[0].text);
      
      // 如果连接成功，发送测试邮件
      console.log('📋 搜狐邮箱发送测试邮件');
      console.log('─────────────────────────────────');
      const sendResult = await server.sendEmail({
        to: ['229637012@qq.com'],
        subject: '搜狐邮箱配置测试',
        text: '这是搜狐邮箱配置功能的测试邮件！\n\n系统已配置搜狐邮箱服务器设置。\n\n测试时间: ' + new Date().toLocaleString()
      });
      console.log(sendResult.content[0].text);
      console.log();
    } catch (error) {
      console.log(`连接测试结果: ${error.message}`);
      console.log('💡 提示: 搜狐邮箱可能需要特殊配置或已停止第三方客户端支持');
    }
    console.log();

    console.log('✅ 搜狐邮箱配置测试完成！');

  } catch (error) {
    console.error('❌ 搜狐邮箱测试失败:', error.message);
  }
}

// 测试所有邮箱服务商配置对比
async function testAllProvidersComparison() {
  console.log('\n🚀 所有邮箱服务商配置对比测试\n');

  const server = new UniversalEmailMCPServer();

  console.log('📋 支持的邮箱服务商自动检测对比');
  console.log('═════════════════════════════════');

  const testEmails = [
    { email: 'user@163.com', expected: '163', name: '网易邮箱' },
    { email: 'user@qq.com', expected: 'qq', name: 'QQ邮箱' },
    { email: 'user@gmail.com', expected: 'gmail', name: 'Gmail' },
    { email: 'user@outlook.com', expected: 'outlook', name: 'Outlook' },
    { email: 'user@hotmail.com', expected: 'outlook', name: 'Hotmail' },
    { email: 'user@live.com', expected: 'outlook', name: 'Live' },
    { email: 'user@exmail.qq.com', expected: 'exmail', name: '腾讯企业邮箱' },
    { email: 'user@aliyun.com', expected: 'aliyun', name: '阿里云邮箱' },
    { email: 'user@sina.com', expected: 'sina', name: '新浪邮箱' },
    { email: 'user@sina.cn', expected: 'sina', name: '新浪邮箱CN' },
    { email: 'user@sohu.com', expected: 'sohu', name: '搜狐邮箱' },
    { email: 'user@126.com', expected: '163', name: '网易126邮箱' },
    { email: 'user@yeah.net', expected: '163', name: '网易Yeah邮箱' }
  ];

  let passCount = 0;
  let totalCount = testEmails.length;

  for (const { email, expected, name } of testEmails) {
    const detected = server.detectEmailProvider(email);
    const status = detected === expected ? '✅' : '❌';
    console.log(`${status} ${name.padEnd(12)} | ${email.padEnd(20)} | 期望: ${expected.padEnd(10)} | 检测: ${detected || 'null'}`);
    
    if (detected === expected) {
      passCount++;
    }
  }

  console.log('\n📊 检测统计');
  console.log('─────────────────────────────────');
  console.log(`✅ 成功: ${passCount}/${totalCount}`);
  console.log(`❌ 失败: ${totalCount - passCount}/${totalCount}`);
  console.log(`📈 成功率: ${((passCount / totalCount) * 100).toFixed(1)}%`);

  console.log('\n💡 重要提示:');
  console.log('   - 个人邮箱可以自动检测配置');
  console.log('   - 企业邮箱需要手动设置 EMAIL_TYPE 字段');
  console.log('   - 所有邮箱都需要开启相应的客户端访问权限');
  console.log('   - Gmail和企业邮箱可能需要特殊的认证方式');
  
  console.log('\n✅ 所有邮箱服务商对比测试完成！');
}

// 运行所有测试
async function runAllTests() {
  await testAutoConfig();
  await testQQAutoConfig();
  await testTencentEnterpriseConfig();
  await testNeteaseEnterpriseConfig();
  await testEnterpriseEmailComparison();
  
  // 新增的邮箱测试
  await testGmailConfig();
  await testOutlookConfig();
  await testAliyunConfig();
  await testSinaConfig();
  await testSohuConfig();
  
  // 综合对比测试
  await testAllProvidersComparison();
}

// runAllTests().catch(console.error); 
testSohuConfig().catch(console.error);