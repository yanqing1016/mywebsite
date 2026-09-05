# 青岩 · 游戏工具网站 · v6

v6 内容：**新增进制转换、导数计算器、积分计算器、学习资料**四个功能 + 第二页入场动画精修 + 桌面滚轮翻页 + 计算器手机端适配。

## 功能总览（第二页 · 每排两个）

| 功能 | 形式 | 说明 |
| --- | --- | --- |
| 戴森球计划 | 独立页 `/dsp/` | 产线计算器 |
| 幸福工厂 | 独立页 `/satisfactory/` | 产线计算器 |
| 音乐解锁 | 独立页 `/music/` | UnlockMusic v1.10.8 |
| 进制转换 | 弹出二级界面 | 2×2 四进制实时换算（支持小数，BigInt 有理数精确换算） |
| 导数计算器 | 独立页 `/derivative/` | 符号求导（CAS 引擎） |
| 积分计算器 | 独立页 `/integral/` | 符号积分（基本积分表 + 线性换元 + 分部积分） |
| 学习资料 | 弹出二级界面 | NAS 分享链接直达下载 |

## 导数 / 积分计算器

- 自研符号计算引擎 `cas.js`（纯前端零依赖）：解析 → 求导/积分 → 化简 → 格式化，系数全程有理数精确运算。
- 求导覆盖：四则、幂、链式法则、一般 u^v（含 x^x）、sin cos tan cot sec csc、asin acos atan、ln log sqrt exp。
- 积分覆盖：多项式/幂、1/x、e^u、a^u、sin cos tan cot ln sqrt、1/(kx+b)、线性换元 u=kx+b、分部积分（如 x·e^x）；超出范围明确提示。
- 快捷输入面板：数字、π/e、运算符、^2、√、ln、三角/反三角等一键在光标处插入；点击函数键自动补全完整括号，光标停在括号内。
- 结果区乘方一律渲染为真正的上标（`<sup>`，如 e<sup>x</sup>、x<sup>1/2</sup>），不再显示 `^` 符号；支持嵌套指数。
- 两页使用主页同款背景图（独立 `.page-bg` 固定层 + 14px 模糊 + 暗色遮罩），进入时内容上浮登场；左上「← 返回功能导航」直达功能页（`../#functions`）。

## 学习资料

卡片点击弹出二级界面，内含 NAS 分享链接（ug.link）直达下载；文件更新只需在 NAS 端操作，网站无需改动。

## 其他改进

1. **桌面端滚轮 = 整页翻页**：滚轮不再自由滚动（那会与强制吸附打架产生卡顿），而是被识别为「翻到下一页/上一页」——阈值累积（兼容触控板小增量）+ 冷却锁（防惯性连翻）。触屏滚动不产生 wheel 事件，手机端不受影响；二级界面打开时滚轮被屏蔽。
2. **计算器手机端适配**：两个计算器原为固定高度应用壳（`body overflow:hidden` + 控制列限高 45vh），手机上控制列被裁切、「计算产线」按钮不可见。现改为移动端**整页自然滚动**：解除固定壳、控制列完整展示（`[v6-patch]` 标记），画布区保留 60vh 供拖拽缩放。
3. **第二页入场编排**：标题字距收拢 + 卡片交错上浮（7 张依次 0.20s→1.04s），滚回重进可重放；用 CSS animation 实现，不影响 hover 灵敏度。（原计划的温度显示功能按需求取消。）
4. **界面清理**：移除页脚（数据来源与版本行）和首页 GAME TOOLS 副标题。

## 站点结构

```
https://yanqing.20051016.xyz/       → 门户（分页式双页）
  第一页：青岩 + 背景图 + 粒子光效
  第二页：功能导航（七个功能卡片，每排两个）
https://yanqing.20051016.xyz/dsp/          → 戴森球计划 产线计算器
https://yanqing.20051016.xyz/satisfactory/ → 幸福工厂 产线计算器
https://yanqing.20051016.xyz/music/        → 音乐解锁 UnlockMusic v1.10.8
https://yanqing.20051016.xyz/derivative/   → 导数计算器
https://yanqing.20051016.xyz/integral/     → 积分计算器
https://yanqing.20051016.xyz/build_info.txt→ 构建时间（验证线上版本）
```

本地目录（v6/ 即站点根）：门户 4 文件 + `dsp/`、`satisfactory/`、`music/`、`derivative/`（index.html + cas.js）、`integral/`（index.html + cas.js）+ 构建配置（package.json / build.js / esa.jsonc / github-upload/ 五个 zip）。

## 上传与推送

v6 起接入 **GitHub API 自动推送**（`D:\test\.tools\github_deploy.py` + `github_deploy.json`，无需 git）：

```bash
python D:\test\.tools\github_deploy.py <版本目录> <相对文件...>   # 推送/更新
python D:\test\.tools\github_deploy.py --del <仓库内路径...>      # 删除仓库文件
python D:\test\.tools\github_deploy.py --check <版本目录> <文件...> # 只比对不修改
```

注意：计算器 zip 的仓库内位置是**根目录** `dsp.zip`、`satisfactory.zip`（与 build.js 的解压约定一致），不是 `github-upload/` 子目录（那只是本地打包暂存区）。

## 本地验证

- `python _verify_local.py` / `python _verify_dist.py`（构建后）—— 全部路径与内容检查。
- 构建：`npm run build`（Node 16.7+；本机可用 `D:\test\.tools` 的便携版 Node 22）。

## 版本历史

- **v1**：门户 + 双计算器合并为单容器站点。
- **v2**：纯黑背景、蓝色粒子环绕光效、大字「青岩」、双按钮入口。
- **v3**：背景图 + 暗色遮罩，粒子透明拖尾；目录结构对齐部署布局。
- **v4**：绿蓝交替粒子、密度提升；接入阿里云 ESA Pages 自动部署（esa.jsonc / build.js / zip 上传包体系）。
- **v5**：分页式双页门户、翻页过渡、粒子随滚动淡出；音乐解锁整合至 `/music/`；门户文件同步上线。
- **v6**：第二页入场动画精修（标题字距收拢 + 卡片交错上浮 + 可重放）；桌面端滚轮接管为整页翻页；两个计算器手机端整页滚动适配（修复「计算产线」按钮不可见）；**新增进制转换（弹出二级界面）、导数计算器、积分计算器、学习资料四个功能**；门户扩展为 7 张长方形卡片（每排两个）；移除页脚与 GAME TOOLS；接入 GitHub API 自动推送。后续补丁：功能卡片整体居中；计算器键盘重排 + ⌫ 退格 + 纯黑背景 + 返回定向功能页；进制转换支持小数（BigInt 有理数精确换算，无限小数以 … 提示）；计算器函数键自动补全右括号；下滑进入功能页背景图模糊过渡（`.page-bg` 独立图层 + `body.at-functions`，styles.css 版本参数随之升至 v6.4）。再补丁：CAS 结果乘方改 HTML `<sup>` 真上标；导数/积分背景改回主页背景图 + 14px 模糊 + 暗色遮罩；**全站进入功能过渡动画**（门户点击卡片整页淡出 280ms 后跳转 + 各子页入场淡入/上浮，bfcache 返回自动复位，`prefers-reduced-motion` 时停用；styles.css 升至 v6.5）。最新补丁：页面标题改为「青岩」；**首页新增环境数据条**（三个温湿度计的温湿度 + 智能插座的功率/温度，横向排在下滑指示上方，60s 刷新）——数据经 NAS Docker 内 nginx 的 `/ha-api/` 代理获取（令牌只在 NAS 端配置），**ESA 线上无代理时自动隐藏**（连续 3 次拉取失败停止重试）；styles.css 升至 v6.6。NAS Docker 部署包见 `网站\docker\`。
- **注意**：多文件推送会产生多个提交，ESA 可能在中途提交上触发构建，把新 URL 的静态资源缓存成旧内容——遇到时把 `?v=` 参数再升一位即可强制回源（本次 styles.css 由 v6.1 升至 v6.2 就是这个原因）。

## 许可

代码 MIT。背景图版权归其作者所有，仅作个人站点背景使用。游戏资产版权归 柚子猫(重庆)网络科技有限公司 / Coffee Stain Studios 所有，仅链接展示。音乐解锁基于 UnlockMusic（unlock-music.dev）。
