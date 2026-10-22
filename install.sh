#!/usr/bin/env bash
# ==============================================================================
# AI 研发全生命周期流水线 - 一键安装与环境初始化脚本
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}     AI 研发全生命周期流水线 (Harness + Orca + Skills) 安装程序     ${NC}"
echo -e "${BLUE}================================================================${NC}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SKILLS_DIR="$HOME/.agents/skills"

# 1. 检查基础命令
echo -e "\n${YELLOW}[1/4] 检查系统基础依赖...${NC}"
for cmd in git curl; do
    if command -v "$cmd" >/dev/null 2>&1; then
        echo -e "  ✔ $cmd 已安装"
    else
        echo -e "  ${RED}✖ 缺少命令: $cmd，请先安装！${NC}"
        exit 1
    fi
done

# 2. 创建 Skills 目标目录
echo -e "\n${YELLOW}[2/4] 初始化 Skills 目标目录: $TARGET_SKILLS_DIR ...${NC}"
mkdir -p "$TARGET_SKILLS_DIR"

# 3. 自动安装/软链 Skills
echo -e "\n${YELLOW}[3/4] 自动安装配套的开源与研发 Skills ...${NC}"
SKILLS_SRC="$PROJECT_ROOT/skills"

for skill_path in "$SKILLS_SRC"/*; do
    if [ -d "$skill_path" ]; then
        skill_name="$(basename "$skill_path")"
        dest_path="$TARGET_SKILLS_DIR/$skill_name"
        
        # 如果已存在同名软链或目录，先备份或覆盖
        if [ -e "$dest_path" ]; then
            echo -e "  🔄 更新已存在的 Skill: ${BLUE}$skill_name${NC}"
            rm -rf "$dest_path"
        else
            echo -e "  ➕ 成功安装 Skill: ${GREEN}$skill_name${NC}"
        fi
        
        # 建立符号链接，方便后续随仓库同步更新
        ln -s "$skill_path" "$dest_path"
    fi
done

# 4. 生成或提示配置文件
echo -e "\n${YELLOW}[4/4] 检查本地环境配置...${NC}"
ENV_FILE="$PROJECT_ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
    cp "$PROJECT_ROOT/config/env.example" "$ENV_FILE"
    echo -e "  📄 已为您生成本地配置文件模板: ${GREEN}$ENV_FILE${NC}"
    echo -e "  👉 ${YELLOW}请务必打开该文件，将其中的 'xxx' 替换为您本机的真实配置！${NC}"
else
    echo -e "  ✔ 本地配置文件已存在: $ENV_FILE"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 安装完成！接下来请执行以下两步：${NC}"
echo -e "  1. 打开配置文件进行个性化配置："
echo -e "     ${YELLOW}vim $ENV_FILE${NC}"
echo -e "  2. 运行环境自检脚本验证工具链是否就绪："
echo -e "     ${YELLOW}./scripts/verify-env.sh${NC}"
echo -e "${GREEN}================================================================${NC}\n"
