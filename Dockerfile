FROM nginx:alpine

# Nginx 配置：门户 / + /dsp/ + /satisfactory/ 三个区域，utf-8 / gzip / 静态缓存
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 门户文件在版本目录根部（与镜像内布局一致，本地双击 index.html 与部署后行为相同），
# 两个计算器目录 dsp/、satisfactory/ 直接对应镜像内子路径。
# 静态文件全部在构建时打包进镜像，运行时不挂载任何卷。
COPY --chown=nginx:nginx index.html styles.css particles.js bg.jpg /usr/share/nginx/html/
COPY --chown=nginx:nginx dsp/ /usr/share/nginx/html/dsp/
COPY --chown=nginx:nginx satisfactory/ /usr/share/nginx/html/satisfactory/

# 构建期自检：任何入口缺失立即失败，避免运行时 403 / 白屏。
RUN test -f /usr/share/nginx/html/index.html \
    && test -s /usr/share/nginx/html/bg.jpg \
    && test -s /usr/share/nginx/html/dsp/data.js \
    && test -s /usr/share/nginx/html/dsp/app.js \
    && test -s /usr/share/nginx/html/satisfactory/data.js \
    && test -s /usr/share/nginx/html/satisfactory/app.js \
    || { echo 'BUILD ERROR: 门户文件或 dsp/、satisfactory/ 缺少入口文件'; exit 1; }

# 世界可读（NAS/SMB 拷贝常带 0600/0700 权限位，会带进镜像层）
RUN chmod -R a+rX /usr/share/nginx/html

# 访问 http://<host>:<port>/build_info.txt 可确认镜像是否为新构建
RUN date -u +"BUILD_TIME %Y-%m-%d %H:%M:%S UTC" > /usr/share/nginx/html/build_info.txt

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
