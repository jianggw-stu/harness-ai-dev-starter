#!/usr/bin/env bash
# ==============================================================================
# AI 研发全生命周期流水线 - 一键独立安装器 (无需克隆仓库)
# 自动安装：底层 AI 技能包 (Skills) + Harness 可视化操作台 UI 插件
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
echo -e "${BLUE}   AI 研发流水线全套安装器 (Skills 技能包 + Harness 操作台插件)   ${NC}"
echo -e "${BLUE}================================================================${NC}"

REPO_OWNER="jianggw-stu"
REPO_NAME="harness-ai-dev-starter"
RELEASE_TAG="v1.0.0"
SKILLS_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${RELEASE_TAG}/skills.tar.gz"
PLUGINS_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${RELEASE_TAG}/harness-plugins.tar.gz"
CONFIG_TEMPLATE_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/config/env.example"

TARGET_SKILLS_DIR="$HOME/.agents/skills"
DSH_DIR="$HOME/.dsh"
DSH_LOCAL_PLUGINS="$HOME/.dsh/local-plugins"
DSH_DESKTOP_PROFILE="$HOME/.dsh/profiles/desktop"

# 1. 检查基础系统依赖
echo -e "\n${YELLOW}[1/5] 检查系统基础环境...${NC}"
for cmd in curl tar; do
    if command -v "$cmd" >/dev/null 2>&1; then
        echo -e "  ✔ $cmd 已就绪"
    else
        echo -e "  ${RED}✖ 缺少命令: $cmd，请先安装！${NC}"
        exit 1
    fi
done

# 2. 安装/挂载底层 Skills 技能包
echo -e "\n${YELLOW}[2/5] 自动安装 AI 底层技能包 (Skills) ...${NC}"
mkdir -p "$TARGET_SKILLS_DIR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
if [ -n "$SCRIPT_DIR" ] && [ -d "$SCRIPT_DIR/skills" ]; then
    echo -e "  📦 从本地仓库副本挂载 Skills..."
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
    echo -e "  🌐 正在从 GitHub Release 下载最新 Skills 资产包..."
    TEMP_DIR="$(mktemp -d)"
    TEMP_TAR="$TEMP_DIR/skills.tar.gz"
    if curl -fsSL "$SKILLS_URL" -o "$TEMP_TAR"; then
        tar -xzf "$TEMP_TAR" -C "$TARGET_SKILLS_DIR"
        rm -rf "$TEMP_DIR"
        echo -e "  ${GREEN}✔ 全部核心 Skills 自动安装成功！${NC}"
    else
        echo -e "  ${RED}✖ 从 Release 下载 Skills 失败，请检查网络连接！${NC}"
        exit 1
    fi
fi

# 3. 安装并挂载 Harness 操作台 UI 插件 (@local/auto-dev-flow)
echo -e "\n${YELLOW}[3/5] 自动安装并注册 Harness 可视化操作台插件 ...${NC}"
mkdir -p "$DSH_LOCAL_PLUGINS"

# 下载插件
if [ -n "$SCRIPT_DIR" ] && [ -d "$SCRIPT_DIR/harness-plugins/auto-dev-flow" ]; then
    echo -e "  📦 从本地仓库副本安装操作台插件..."
    rm -rf "$DSH_LOCAL_PLUGINS/auto-dev-flow"
    cp -r "$SCRIPT_DIR/harness-plugins/auto-dev-flow" "$DSH_LOCAL_PLUGINS/auto-dev-flow"
else
    echo -e "  🌐 正在从 GitHub Release 下载 Harness 操作台插件..."
    TEMP_DIR="$(mktemp -d)"
    TEMP_TAR="$TEMP_DIR/harness-plugins.tar.gz"
    if curl -fsSL "$PLUGINS_URL" -o "$TEMP_TAR"; then
        tar -xzf "$TEMP_TAR" -C "$DSH_LOCAL_PLUGINS"
        rm -rf "$TEMP_DIR"
    else
        echo -e "  ${YELLOW}⚠ 未能下载到操作台插件包，跳过插件安装${NC}"
    fi
fi

# 注册插件到 Harness Desktop Profile
if [ -d "$DSH_DESKTOP_PROFILE" ]; then
    echo -e "  ⚙️ 检测到本机 Harness 桌面环境，正在自动激活插件..."
    mkdir -p "$DSH_DESKTOP_PROFILE/node_modules/@local"
    rm -rf "$DSH_DESKTOP_PROFILE/node_modules/@local/auto-dev-flow"
    ln -s "$DSH_LOCAL_PLUGINS/auto-dev-flow" "$DSH_DESKTOP_PROFILE/node_modules/@local/auto-dev-flow"

    # 如果有 package.json，自动写入依赖与 bundle
    PKG_FILE="$DSH_DESKTOP_PROFILE/package.json"
    if [ -f "$PKG_FILE" ]; then
        python3 -c "
import json
try:
    with open('$PKG_FILE', 'r') as f:
        pkg = json.load(f)
    pkg.setdefault('dependencies', {})
    pkg['dependencies']['@local/auto-dev-flow'] = 'link:../../local-plugins/auto-dev-flow'
    pkg.setdefault('dsh', {}).setdefault('profile', {}).setdefault('bundles', [])
    if '@local/auto-dev-flow' not in pkg['dsh']['profile']['bundles']:
        pkg['dsh']['profile']['bundles'].append('@local/auto-dev-flow')
    with open('$PKG_FILE', 'w') as f:
        json.dump(pkg, f, indent=2)
    print('  ✔ 已成功在 Harness 注册 @local/auto-dev-flow 插件')
except Exception as e:
    print('  ⚠ 插件自动注册提示:', e)
" 2>/dev/null || true
    fi

    # 软链接 skills 到 ~/.dsh/skills
    mkdir -p "$DSH_DIR/skills"
    ln -sf "$TARGET_SKILLS_DIR/dev-lifecycle" "$DSH_DIR/skills/dev-lifecycle" 2>/dev/null || true
    echo -e "  ${GREEN}✔ Harness 可视化操作台插件安装并激活成功！${NC}"
else
    echo -e "  ${YELLOW}ℹ 未检测到 ~/.dsh/profiles/desktop 目录。安装 Harness 客户端后将自动生效。${NC}"
fi

# 4. 生成本地配置文件模板
echo -e "\n${YELLOW}[4/5] 准备本地开发环境配置模板...${NC}"
LOCAL_ENV="./.env.local"

if [ ! -f "$LOCAL_ENV" ]; then
    if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/config/env.example" ]; then
        cp "$SCRIPT_DIR/config/env.example" "$LOCAL_ENV"
    else
        curl -fsSL "$CONFIG_TEMPLATE_URL" -o "$LOCAL_ENV" 2>/dev/null || true
    fi
    echo -e "  📄 已在当前目录下生成本地配置文件模板: ${GREEN}$LOCAL_ENV${NC}"
else
    echo -e "  ✔ 本地配置文件已存在: $LOCAL_ENV"
fi

# 5. 完成提示
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 全套安装成功！您已拥有完整的 AI 技能包 + Harness 操作台！${NC}"
echo -e "  1. 打开配置文件填入您个人的 Maven / Docker 路径："
echo -e "     ${YELLOW}vim $LOCAL_ENV${NC}"
echo -e "  2. 启动或重启 ${BLUE}DeepSeek Harness${NC} 客户端："
echo -e "     👉 左侧功能栏将直接出现专属的 ${GREEN}可视化研发操作台${NC}！"
echo -e "${GREEN}================================================================${NC}\n"
