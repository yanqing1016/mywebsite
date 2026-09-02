# 青岩 · 游戏产线计算器网站 · v4

在 v3 基础上只调整了粒子光效：

- **绿蓝交替**：粒子按序号偶数取绿色调（色相 132/145/155）、奇数取蓝色调（色相 203/212/222），背景星尘同样绿蓝交替；中心辉光保持蓝色。
- **密度翻倍**：三条轨道的粒子数量从 55/70/85 提高到 110/140/170（共 420 颗；手机屏仍自动按 0.6 系数缩减）。

其余（背景图、暗色遮罩、「青岩」字号、双按钮、目录结构与镜像对齐、端口 2028）均与 v3 相同。

```
http://<主机IP>:2028/              → 门户首页（青岩 · 背景图 + 绿蓝粒子光效）
http://<主机IP>:2028/dsp/          → 戴森球计划 产线计算器
http://<主机IP>:2028/satisfactory/ → 幸福工厂 产线计算器
```

## 目录结构（= 镜像内布局）

```
网站/
└── v4/                  # 本目录就是站点根目录
    ├── index.html       # 门户：青岩 + 双按钮
    ├── styles.css       # 背景图 + 遮罩 + 标题/按钮样式
    ├── particles.js     # 绿蓝交替粒子环绕光效（透明画布，密度×2）
    ├── bg.jpg           # 背景图（1920×1080 压缩版）
    ├── dsp/             # 戴森球计算器 app 原样副本
    ├── satisfactory/    # 幸福工厂计算器 app 原样副本
    ├── package.json     # 静态托管构建入口（无依赖，build = node build.js）
    ├── build.js         # 构建脚本：校验入口文件 + 复制站点到 dist/
    ├── esa.jsonc        # 阿里云 ESA 构建配置（installCommand/buildCommand/outputDirectory）
    ├── .gitignore       # 忽略 node_modules/ 与 dist/（构建产物）
    ├── Dockerfile
    ├── nginx.conf
    ├── docker-compose.yml
    ├── .dockerignore
    └── README.md
```

## 部署（阿里云 ESA / GitHub 仓库静态托管）

仓库 [yanqing1016/mywebsite](https://github.com/yanqing1016/mywebsite) 的根目录就是站点根（index.html、dsp/、satisfactory/……），可直接在 ESA「Pages/站点托管」里从 Git 构建。

**此前构建失败的原因**：ESA 的默认构建流程是 `npm install` → `npm run build`（Node 22）。仓库里没有 `package.json` 时，安装步骤能跳过，但构建步骤直接执行 npm 就报 `ENOENT: no such file or directory ... package.json` 而失败；`esa.jsonc` 是 ESA 的可选构建配置文件，缺失只会记一条日志并回退默认值。

**v4 已修复**（原地补充，不影响 Docker 部署）：

- `package.json`：零依赖，仅声明 `"build": "node build.js"`，让 ESA 的默认构建命令能跑通。
- `build.js`：构建 = 校验入口文件存在 + 把站点文件复制到 `dist/` + 生成 `build_info.txt`（Node 16.7+ 标准库，ESA 的 Node 22 直接可用）。
- `esa.jsonc`：声明安装命令留空、构建命令 `npm run build`、输出目录 `dist`；字段名按 ESA 日志推导，若与控制台设置不一致，以控制台为准。

ESA 控制台里对应设置（若面板可填）：安装命令留空、构建命令 `npm run build`、**输出目录 `dist`**。推送到 main 分支后触发重建，构建成功后通过 `https://<你的域名>/build_info.txt` 验证是否为新构建。

## 部署（NAS / 任意 Docker 主机）

把整个 `v4/` 目录传到 NAS，然后：

```bash
cd v4
docker compose up -d --build   # 更新后必须带 --build，否则会复用旧镜像
```

- 修改端口：改 `docker-compose.yml` 里 `ports:` 左侧数字。
- 验证新版本：门户页脚注应显示 `v4`；或访问 `/build_info.txt` 看构建时间。

## 更新计算器

```powershell
robocopy D:\test\戴森球计算器\app   D:\test\网站\v4\dsp           /MIR
robocopy D:\test\幸福工厂计算器\app D:\test\网站\v4\satisfactory  /MIR
```

重新 `docker compose up -d --build` 即可。

## 本地预览

- 最简单：直接双击 `index.html`（目录结构与线上完全一致）。
- 或 `python -m http.server 8080`（在本目录），访问 `http://localhost:8080/`。

## 版本历史

- **v1**：门户 + 双计算器合并为单容器站点（卡片式导航页）。
- **v2**：门户重做 —— 纯黑背景、蓝色粒子环绕光效、大字「青岩」、双按钮入口。
- **v3**：「青岩」调小；新增背景图（压缩 1920×1080）+ 暗色遮罩，粒子改透明拖尾；目录结构对齐镜像布局。
- **v4**：粒子改为绿蓝交替，密度增加一倍（210 → 420 颗）。
- **v4 修订**（原地更新，不另开版本）：两个入口按钮下移贴到视口下部（标题中偏上、按钮距底部约 11vh），中间完全让位给粒子光效；粒子更小更细腻、密度 420 → 600 颗、绿蓝色相进一步拉开（118–138 对 210–226）提高对比度；缓存参数 `styles.css?v=4.2`、`particles.js?v=4.3`。
- **v4 修订 2**（原地更新）：修复阿里云 ESA 从 Git 构建失败的问题——新增 `package.json`、`build.js`、`esa.jsonc`、`.gitignore`，构建 = 复制站点到 `dist/`；Docker 部署不受影响。

## 许可

代码 MIT。背景图版权归其作者所有，仅作个人站点背景使用。游戏资产版权归 柚子猫(重庆)网络科技有限公司 / Coffee Stain Studios 所有，仅链接展示。
