#!/bin/bash
# 错题小老师 - 后端一键部署脚本
# 用法: 在云服务器上执行
#   curl -sSL <你的脚本地址> | bash
#   或: bash deploy.sh
#
# 前置条件: Ubuntu/Debian 系统，root 或 sudo 权限

set -e

APP_DIR="/opt/cuoti-server"
SERVICE_NAME="cuoti"

echo "=== 错题小老师后端部署 ==="

# 1. 安装 Node.js 20
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
  echo "→ 安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "  Node $(node -v), npm $(npm -v)"

# 2. 创建应用目录
echo "→ 部署到 $APP_DIR ..."
sudo mkdir -p "$APP_DIR"
sudo cp -r ./* "$APP_DIR/"
cd "$APP_DIR"

# 3. 安装依赖
echo "→ 安装依赖..."
sudo npm install --production

# 4. 创建 .env（如果不存在）
if [ ! -f .env ]; then
  sudo cp .env.example .env
  echo ""
  echo "⚠️  请编辑 $APP_DIR/.env 填入你的 API Key："
  echo "    sudo nano $APP_DIR/.env"
  echo ""
fi

# 5. 创建 systemd 服务
echo "→ 配置开机自启..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << EOF
[Unit]
Description=错题小老师后端
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStart=$(which node) index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

# 6. 检查状态
sleep 2
if sudo systemctl is-active --quiet ${SERVICE_NAME}; then
  echo ""
  echo "✅ 部署成功！"
  echo ""
  echo "  服务状态: sudo systemctl status ${SERVICE_NAME}"
  echo "  查看日志: sudo journalctl -u ${SERVICE_NAME} -f"
  echo "  编辑配置: sudo nano $APP_DIR/.env"
  echo "  重启服务: sudo systemctl restart ${SERVICE_NAME}"
  echo ""
  # 获取公网IP
  PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "你的服务器IP")
  echo "  后端地址: http://${PUBLIC_IP}:3000"
  echo "  手机 App .env 设置: EXPO_PUBLIC_API_URL=http://${PUBLIC_IP}:3000"
  echo ""
  echo "  ⚠️ 生产环境建议用 nginx 反代 + HTTPS"
else
  echo "❌ 启动失败，查看日志: sudo journalctl -u ${SERVICE_NAME} -n 50"
  exit 1
fi
