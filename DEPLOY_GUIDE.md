# 黄庭禅站桩计时器 - Netlify部署指南

## 前提条件

1. 拥有GitHub账号
2. 拥有Netlify账号
3. 本地安装Git

## 部署步骤

### 1. 创建GitHub仓库

1. 登录你的GitHub账号
2. 点击右上角的「+」按钮，选择「New repository」
3. 填写仓库名称（例如：`htczz-timer`）
4. 选择公开或私有仓库
5. 点击「Create repository」

### 2. 上传项目文件到GitHub

在你的本地项目目录中执行以下命令：

```bash
# 初始化Git仓库（如果尚未初始化）
git init

# 添加项目文件
git add .

# 提交更改
git commit -m "初始提交"

# 添加远程仓库（替换为你创建的仓库URL）
git remote add origin https://github.com/YOUR_USERNAME/htczz-timer.git

# 推送到GitHub
git push -u origin main
```

### 3. 通过GitHub连接Netlify

1. 登录你的Netlify账号
2. 点击顶部导航栏的「Add new site」按钮，选择「Import an existing project」
3. 选择「GitHub」作为你的Git提供商
4. 如果是首次连接，根据提示授权Netlify访问你的GitHub账户
5. 搜索并选择你的项目仓库（`htczz-timer`）

### 4. 配置Netlify部署设置

在项目配置页面：

1. **Build settings**部分：
   - Build command: 留空（因为这是静态站点）
   - Publish directory: `.`（根目录）

2. 点击「Show advanced」按钮，添加环境变量（如果需要）

3. 点击「Deploy site」按钮开始部署

### 5. 自定义域名（可选）

1. 部署完成后，点击「Domain settings」
2. 点击「Add custom domain」输入你的域名
3. 按照提示在你的域名注册商处设置DNS记录
4. 可选：开启HTTPS（Netlify提供免费SSL证书）

### 6. 持续部署

完成上述步骤后，Netlify会自动检测GitHub仓库的更改并重新部署站点：

1. 当你推送到GitHub仓库的主分支时，Netlify会自动触发新的构建
2. 你可以在Netlify仪表板的「Deploys」选项卡中查看构建历史和状态

## 部署后的配置

### 启用分支部署（可选）

如果你想为开发分支设置预览环境：

1. 在Netlify项目设置中，点击「Build & Deploy」
2. 找到「Branch deploys」选项，选择「All」或「Let me add individual branches」
3. 保存设置

### 启用HTTPS

Netlify自动为自定义域名提供免费SSL证书：

1. 在「Domain settings」中找到「HTTPS」部分
2. 点击「Verify DNS configuration」
3. 点击「Let’s Encrypt Certificate」下的按钮获取证书

## 故障排除

### 常见问题

1. **部署失败**：检查「Deploys」选项卡中的构建日志以获取详细错误信息
2. **资源加载问题**：确保资源路径正确，并且在`netlify.toml`中正确配置了缓存头
3. **PWA功能不正常**：确保`manifest.json`和`service-worker.js`配置正确，并且包含在部署中

### 联系支持

如果遇到部署问题，可以：
1. 查看Netlify的官方文档：https://docs.netlify.com/
2. 访问Netlify支持中心：https://www.netlify.com/support/

## 更新记录

- 首次部署日期：[填写日期]
- 文档最后更新：[填写日期]