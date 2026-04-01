# OpenClaw Patches

在 CI 构建时，`openclaw` npm 包安装完成后自动应用这些 patch。

## 待创建的 Patch 文件

### zh-CN.patch
- 汉化 OpenClaw 界面文本（菜单、按钮、提示等）
- 基于社区汉化版（每小时同步官方）
- 在集成 openclaw npm 包后，对比中英文差异生成

### yourpro-provider.patch
- 将 YourPro 后端注册为默认 model provider
- 确保 openclaw.json 中 yourpro provider 优先级最高
- 在集成 openclaw npm 包后，根据实际配置格式生成

## 如何创建 Patch

```bash
# 1. 安装 openclaw 包
cd openclaw && npm install openclaw@latest

# 2. 修改目标文件（汉化/配置）
# 3. 生成 patch
git diff > patches/zh-CN.patch

# 4. CI 中应用
cd openclaw/node_modules/openclaw && patch -p1 < ../../patches/zh-CN.patch
```

## 注意事项

- Patch 应基于锁定的 OpenClaw 版本，升级后需重新验证
- 当前开发阶段使用 openclaw/index.js 占位，patch 不生效
