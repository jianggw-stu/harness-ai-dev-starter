#!/usr/bin/env bash
# ==============================================================================
# AI 研发全生命周期流水线 - 一键独立安装器 (无需克隆仓库)
# 快速体验命令:
# curl -fsSL https://raw.githubusercontent.com/jianggw-stu/harness-ai-dev-starter/main/install.sh | bash
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}     AI 研发全生命周期流水线 (Harness + Orca + Skills) 安装程序     ${NC}"
echo -e "${BLUE}================================================================${NC}"

REPO_OWNER="jianggw-stu"
REPO_NAME="harness-ai-dev-starter"
RELEASE_TAG="v1.0.0"
SKILLS_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${RELEASE_TAG}/skills.tar.gz"
CONFIG_TEMPLATE_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/config/env.example"
TARGET_SKILLS_DIR="$HOME/.agents/skills"

# 1. 检查基础系统依赖
echo -e "\n${YELLOW}[1/4] 检查系统环境...${NC}"
for cmd in curl tar; do
    if command -v "$cmd" >/dev/null 2>&1; then
        echo -e "  ✔ $cmd 已安装"
    else
        echo -e "  ${RED}✖ 缺少命令: $cmd，请先安装！${NC}"
        exit 1
    fi
done

# 2. 创建 Skills 目录
echo -e "\n${YELLOW}[2/4] 初始化 Skills 目录: $TARGET_SKILLS_DIR ...${NC}"
mkdir -p "$TARGET_SKILLS_DIR"

# 3. 下载并解压安装 Skills (自动支持远程 curl 与本地运行两种模式)
echo -e "\n${YELLOW}[3/4] 自动下载并安装配套的开源与研发 Skills ...${NC}"

# 如果本地已有 skills/ 目录 (说明在已克隆的仓库中运行)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
if [ -n "$SCRIPT_DIR" ] && [ -d "$SCRIPT_DIR/skills" ]; then
    echo -e "  📦 检测到本地仓库副本，直接从本地安装..."
    for skill_path in "$SCRIPT_DIR/skills"/*; do
        if [ -d "$skill_path" ]; then
            skill_name="$(basename "$skill_path")"
            dest_path="$TARGET_SKILLS_DIR/$skill_name"
            rm -rf "$dest_path"
            cp -r "$skill_path" "$dest_path"
            echo -e "  ✔ 已安装 Skill: ${GREEN}$skill_name${NC}"
        fi
    done
else
    # 远程模式：直接从 GitHub Release 下载压缩包
    echo -e "  🌐 正在从 GitHub Release 下载 Skills 资产包 (${RELEASE_TAG})..."
    TEMP_DIR="$(mktemp -d)"
    TEMP_TAR="$TEMP_DIR/skills.tar.gz"
    
    if curl -fsSL "$SKILLS_URL" -o "$TEMP_TAR"; then
        echo -e "  📦 正在解压并挂载到 $TARGET_SKILLS_DIR ..."
        tar -xzf "$TEMP_TAR" -C "$TARGET_SKILLS_DIR"
        rm -rf "$TEMP_DIR"
        echo -e "  ${GREEN}✔ 全部核心 Skills 自动安装成功！${NC}"
    else
        echo -e "  ${RED}✖ 从 Release 下载失败，请检查网络连接或访问: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases${NC}"
        exit 1
    fi
fi

# 4. 生成本地配置文件模板
echo -e "\n${YELLOW}[4/4] 准备本地环境配置模板...${NC}"
LOCAL_ENV="./.env.local"

if [ ! -f "$LOCAL_ENV" ]; then
    if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/config/env.example" ]; then
        cp "$SCRIPT_DIR/config/env.example" "$LOCAL_ENV"
    else
        curl -fsSL "$CONFIG_TEMPLATE_URL" -o "$LOCAL_ENV" 2>/dev/null || true
    fi
    echo -e "  📄 已在当前目录下生成本地配置文件模板: ${GREEN}$LOCAL_ENV${NC}"
    echo -e "  👉 ${YELLOW}请打开该文件，将其中的 'xxx' 替换为您本机的真实配置！${NC}"
else
    echo -e "  ✔ 本地配置文件已存在: $LOCAL_ENV"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 安装完成！您无需克隆任何仓库即可直接使用这套 Skills！${NC}"
echo -e "  1. 打开配置文件进行个性化配置："
echo -e "     ${YELLOW}vim $LOCAL_ENV${NC}"
echo -e "  2. 启动 Harness 桌面客户端，选择工单即可一键体验全自动闭环！"
echo -e "${GREEN}================================================================${NC}\n"
