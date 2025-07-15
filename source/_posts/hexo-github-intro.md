---
title: 基于 Hexo 和 GitHub 搭建个人博客网站
date: 2020-06-27 23:33:33
tags:
- Hexo
- GitHub
categories:
- 瞎折腾
---

本文介绍基于 Hexo 和 GitHub 搭建个人博客网站的简要步骤。

<!-- more -->

## 环境搭建

### Node.js

首先安装 [fnm](https://github.com/Schniz/fnm)，这是一个 Node.js 版本管理工具。Node.js 是一个 JavaScript 运行环境，Hexo 静态博客生成器基于它运行。

{% tabs fnm %}
<!-- tab Windows -->
使用 winget 安装 fnm：

```PowerShell
winget install Schniz.fnm
```
<!-- endtab -->

<!-- tab Linux -->
确保已经安装了 `curl` 和 `unzip`，然后运行：

```bash
curl -fsSL https://fnm.vercel.app/install | bash
```
<!-- endtab -->
{% endtabs %}

然后使用 fnm 安装 Node.js 最新 LTS 版本（当前是 22）：

```bash
fnm install 22
```

安装成功的标志是运行 `node -v` 和 `npm -v` 会产生软件的版本号。

### Git & GitHub

Git是一款版本控制工具，Linux 系统一般已经默认安装，Windows 系统可运行以下命令安装：

```bash
winget install Git.Git
git -v  # 检查是否安装成功
```

安装完成后，Windows 终端将可以使用 Git Bash，后续所有操作都将在此进行。
然后，注册一个 GitHub 账号，并创建一个名为 `<username>.github.io` 的仓库，其中 `<username>` 为你的 GitHub 用户名，下同。
执行以下命令来连接到 GitHub：

```bash
git config --global user.name "username"
git config --global user.email "your@mail.com"
```

为了能将本地仓库推送到 GitHub，需要配置 SSH key：

```bash
ssh-keygen -t rsa -C "your@mail.com"
cat ~/.ssh/id_rsa.pub
```

生成过程中会提示输入文件保存位置和密码，直接回车使用默认设置即可。

将输出的内容复制（如果是在 Git Bash，不要使用 `Ctrl+C`，选中内容后右键点击 `Copy` 进行复制）。
在 GitHub 账户设置页面点击 `SSH and GPG keys` 和 `New SSH key`，`Title` 可任取，在 `Key` 中粘贴前一步复制的内容，点击 `Add SSH key` 完成操作。
执行`ssh -T git@github.com`，出现下面的结果说明操作成功：

```bash
$ ssh -T git@github.com
Hi <username>! You've successfully authenticated, but GitHub does not provide shell access.
```

如果出现以下提示，输入`yes`然后回车：

```bash
Are you sure you want to continue connecting (yes/no)?
```

### Hexo

新建一个文件夹，用于存放博客网站相关文件，比如 `D:\blog`（Windows）或 `~/blog`（Linux）。在此目录下，执行以下命令：

```bash
npm install hexo-cli -g     # 安装 hexo
hexo init                   # 初始化博客网站
npm install                 # 安装依赖
```

这时，文件夹中将生成 `_config.yml` 文件，这是网站的配置文件。还有一个 `_config.landscape.yml` 文件，这是主题的配置文件，我们稍后会用到。

然后，安装几个有用的插件：

```bash
npm install hexo-deployer-git --save            # 用于部署到 GitHub
npm uninstall hexo-renderer-marked --save       # 卸载默认的渲染器，不支持图片
npm install hexo-renderer-markdown-it --save    # 安装支持图片的渲染器
npm install hexo-image-link --save              # 用于在文章中插入图片
```

打开网站配置文件 `_config.yml`，修改文件末尾处的 `Deployment` 配置：

```yml
# Deployment
## Docs: https://hexo.io/docs/one-command-deployment
deploy:
  type: 'git'
  repository: git@github.com:<username>/<username>.github.io.git
  branch: deploy
```

至此，环境就搭建好了。你可以执行 `hexo g` 生成静态网页，然后执行 `hexo s` 启动本地服务器预览。这时，使用浏览器进入[http://localhost:4000/](http://localhost:4000/)就可以预览 Hexo 生成的网页了。按下 `Ctrl+C` 可以关闭本地服务器。执行 `hexo d` 将网页部署到 GitHub 上，稍等一分钟后，就可以在浏览器中访问你的博客网站了。

## 个性化配置

### 修改网站基本信息

在网站配置文件中，有几个个性化信息需要修改：

1. `title`：网站标题，就是浏览器标签页上显示的标题
2. `subtitle`：网站副标题，在有的主题中显示为标题下面的一行小字
3. `author`：作者姓名，通常显示在页面底部
4. `language`：中文为`zh-CN`

### 写下第一篇文章

首先，为了便于在文章中插入图片，请在网站配置文件中将 `post_asset_folder` 的值设置为 `true`。

要新建文章，执行以下命令：

```bash
hexo new post "postname"
```

命令执行后，打开 `\source\_posts` 目录，会发现多了一个 `.md` 文件和同名的文件夹。你也可以手动新建这个文件和同名文件夹，和前面的命令效果相同。接下来，你就可以在 `.md` 文件中写作，而同名的文件夹将用来存放文章中的图片等数据。

执行 `hexo clean` 清除缓存（也可不执行），重新执行 `hexo g && hexo s` 生成并预览，可以看到新文章已经出现在页面上。

### 更换主题

可访问[主题页面](https://hexo.io/themes/)找到自己喜欢的主题进行下载。这里以笔者使用的 [NexT](https://theme-next.js.org/docs/getting-started/#NexT-Installation) 主题为例，执行以下命令来安装：

```bash
npm install hexo-theme-next --save
```

打开网站配置文件，在文件的末尾处修改主题：

```yml
## Themes: https://hexo.io/themes/
theme: next
```

重新生成看看效果吧！

### NexT 主题配置

在主题文件夹可以找到另一个配置文件 `./node_modules/hexo-theme-next/_config.yml`，将其复制一份到根目录，并重命名为 `_config.next.yml`，这么做的原因详见[此处](https://theme-next.js.org/docs/getting-started/configuration)。你也可以用一行代码完成这个步骤：

```bash
cp ./node_modules/hexo-theme-next/_config.yml _config.next.yml
```

修改其中的内容就可对主题进行配置，详见[主题文档](https://theme-next.js.org/docs/theme-settings/)。

## 基于 GitHub Actions 自动部署

上述操作，只将构建好的网页部署到了 GitHub 上，而没有对 `.md` 源文件进行备份。基于 GitHub Actions，我们可以实现自动部署，省去本地构建的步骤，从而更专注于写作。下面进行简要介绍。

1. 卸载不再需要的 `hexo-deployer-git` 插件：

    ```bash
    npm uninstall hexo-deployer-git --save
    ```

    同时，在 `_config.yml` 文件中，注释掉 `Deployment` 部分的配置，因为已经不需要了。

1. 在仓库根目录下新建 `.github/workflows/deploy.yml` 文件，内容如下：

    ```yml
    name: Deploy Hexo to GitHub Pages

    on:
    push:
        branches: [ main ]

    jobs:
    build-and-deploy:
        runs-on: ubuntu-latest
        
        steps:
        - name: Checkout main
        uses: actions/checkout@v4
        
        - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
            node-version: '22'
            cache: 'npm'
    
        - name: Cache Hexo files
        uses: actions/cache@v4
        with:
            path: |
            db.json
            .deploy_git
            public
            key: hexo-${{ runner.os }}-${{ hashFiles('_config.yml', '_config.next.yml', 'package-lock.json') }}
            restore-keys: |
            hexo-${{ runner.os }}-

        - name: Install dependencies
        run: npm ci
        
        - name: Clean and generate
        run: |
            npm run clean
            npm run build
            
        - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        if: github.ref == 'refs/heads/main'
        with:
            github_token: ${{ secrets.GITHUB_TOKEN }}
            publish_dir: ./public
            publish_branch: deploy
            force_orphan: true
            enable_jekyll: false
            keep_files: false
    ```

1. 前往 GitHub 仓库 Settings → Actions → General，在 "Workflow permissions" 部分，选择 "Read and write permissions" 并保存更改。

1. 在根目录初始化 Git 仓库，并且将本地源码推送到新分支，比如 `main`：

    ```bash
    git init    # 在根目录初始化
    git add .   # 添加所有文件
    git commit -m "Initial commit"  # 提交
    git branch -M main    # 重命名本地主分支为 main
    git remote add origin git@github.com:<username>/<username>.github.io.git    # 连接远程仓库
    git push -u origin main   # 推送到远程仓库
    ```

    或许你已经注意到，根目录已经存在了 `.gitignore` 文件，这是刚刚初始化 Hexo 时就已经创建的，其内容为：

    ```gitignore
    .DS_Store
    Thumbs.db
    db.json
    *.log
    node_modules/
    public/
    .deploy*/
    _multiconfig.yml
    ```

    这为我们提供了一些方便。

1. 每次写作完成后，执行以下命令即可将文章推送到 GitHub：

    ```bash
    git add .
    git commit -m "Update"
    git push
    ```

    或者在 Visual Studio Code 中使用源代码管理功能进行提交和推送。

## 实用功能：文章时效性提示

一些文章很容易随时间过时，如何添加提醒呢？以下是简单的示范。

1. 在仓库根目录下新建 `scripts` 文件夹，并在其中新建 `injector.js` 文件，内容如下：

    ```Javascript
    //注入文章过期提示
    hexo.extend.injector.register('body_end', `<script src="/js/outdate.js"></script>`,'post')
    ```

1. 在仓库根目录下新建 `source/js` 文件夹，并在其中新建 `outdate.js` 文件，内容如下（部分代码由人工智能生成）：

    ```Javascript
    // 文章时效性提示 - 简化版本，充分信任 Hexo/NexT 的结构化 HTML
    (function() {
    'use strict';

    // 配置参数
    const CONFIG = {
        warningDays: 200,
        errorDays: 400,
        warningClass: 'note warning',
        errorClass: 'note danger',
        title: '文章时效性提示',
        template: '这是一篇{type}于 {time} 前的文章，部分信息可能已发生改变，请注意甄别。'
    };

    // 仅在文章页面执行（信任 NexT 主题的 DOM 结构）
    const postBody = document.querySelector('.post-body');
    if (!postBody) return;

    // 信任 Hexo 的结构化时间元素（使用标准 Schema.org microdata）
    const updateTimeEl = document.querySelector('time[itemprop*="dateModified"]');
    const publishTimeEl = document.querySelector('time[itemprop*="dateCreated"], time[itemprop*="datePublished"]');

    if (!publishTimeEl) return; // 静默失败，避免控制台噪音

    // 信任 Hexo 生成的 datetime 属性格式
    const referenceTime = updateTimeEl?.dateTime || publishTimeEl.dateTime;
    const diffDays = Math.floor((Date.now() - new Date(referenceTime)) / 86400000);

    // 简化的时间格式化
    const formatTimeAgo = days => {
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        return years ? `${years} 年${months ? ` ${months} 个月` : ''}` :
            months ? `${months} 个月` : `${days} 天`;
    };

    // 添加时效性提示
    if (diffDays > CONFIG.warningDays) {
        const notice = Object.assign(document.createElement('div'), {
        className: diffDays >= CONFIG.errorDays ? CONFIG.errorClass : CONFIG.warningClass,
        innerHTML: `<h5>${CONFIG.title}</h5><p>${CONFIG.template
            .replace('{time}', formatTimeAgo(diffDays))
            .replace('{type}', updateTimeEl ? '更新' : '发布')}</p>`
        });

        postBody.insertAdjacentElement('afterbegin', notice);
    }
    })();
    ```

## 参考文献

[1] [超详细Hexo+Github博客搭建小白教程 | 韦阳的博客](https://godweiyang.com/2018/04/13/hexo-blog/)
[2] [Hexo 插入图片_疾风jf的博客-CSDN博客](https://blog.csdn.net/rentonhe/article/details/123666769)
[3] [Hexo博客进阶：为 Next 主题的 Hexo 博客内容添加文章过期/时效提示_hexo配置过期时间-CSDN博客](https://blog.csdn.net/jiunian_2761/article/details/126763510)
