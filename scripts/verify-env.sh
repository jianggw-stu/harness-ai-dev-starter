#!/usr/bin/env bash
# ==============================================================================
# AI 研发全生命周期流水线 - 本地运行环境一键自检脚本
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 加载本地配置
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    source "$PROJECT_ROOT/.env.local"
fi

echo -e "\n${BLUE}================================================================${NC}"
echo -e "${BLUE}          本地开发与 AI 编排环境连通性自检报告                   ${NC}"
echo -e "${BLUE}================================================================${NC}\n"

ERRORS=0

# 1. 检查 JDK 11
echo -n "• 检查 JDK 11 环境... "
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA_VER=$("$JAVA_HOME/bin/java" -version 2>&1 | awk -F '"' '/version/ {print $2}')
    echo -e "${GREEN}✔ 成功 (${JAVA_VER})${NC}"
else
    echo -e "${RED}✖ 失败: JAVA_HOME 未设置或无效路径${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 2. 检查 Maven
echo -n "• 检查 Maven 构建工具... "
MVN_BIN="${MAVEN_HOME:-/usr}/bin/mvn"
if [ -x "$MVN_BIN" ]; then
    MVN_VER=$("$MVN_BIN" -v | head -n 1)
    echo -e "${GREEN}✔ 成功 ($MVN_VER)${NC}"
else
    echo -e "${RED}✖ 失败: 未找到可执行的 mvn 命令${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. 检查 Docker 与 MySQL
echo -n "• 检查 Docker 守护进程... "
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}✔ Docker 运行正常${NC}"
    
    # 检查测试数据库容器
    DB_CONTAINER="${LOCAL_TEST_DB_CONTAINER:-xxx-mysql}"
    echo -n "• 检查本地测试容器 [${DB_CONTAINER}]... "
    if docker ps --format '{{.Names}}' | grep -Eq "^${DB_CONTAINER}$"; then
        echo -e "${GREEN}✔ 容器已在运行中${NC}"
    else
        echo -e "${YELLOW}⚠ 提示: 容器 '${DB_CONTAINER}' 未在运行中 (需要执行落盘测试时请拉起)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 提示: Docker 未启动 (离线纯单测不受影响，落盘测试需启动)${NC}"
fi

# 4. 检查 Orca 引擎
echo -n "• 检查 Orca 调度引擎... "
if command -v orca >/dev/null 2>&1; then
    echo -e "${GREEN}✔ Orca 已安装在 PATH${NC}"
else
    echo -e "${YELLOW}⚠ 提示: 命令行未找到 'orca' (如已安装 Harness App 可直接在 GUI 中使用)${NC}"
fi

# 5. 检查 Skills 软链安装状态
echo -n "• 检查 Skills 技能库挂载... "
TARGET_SKILLS_DIR="$HOME/.agents/skills"
MISSING_SKILLS=0
for s in dev-lifecycle grill-me answer-me-with-html codebase-investigation orca-cli caveman ponytail; do
    if [ ! -e "$TARGET_SKILLS_DIR/$s" ]; then
        MISSING_SKILLS=$((MISSING_SKILLS + 1))
    fi
done

if [ $MISSING_SKILLS -eq 0 ]; then
    echo -e "${GREEN}✔ 全部核心 Skills 均已就绪${NC}"
else
    echo -e "${RED}✖ 缺失 $MISSING_SKILLS 个 Skill，请重新运行 ./install.sh${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -e "\n${BLUE}================================================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 恭喜！本地核心环境核验通过，可以启动 Harness 开始研发！${NC}"
else
    echo -e "${RED}⚠ 检测到 $ERRORS 处未就绪项，请根据上述提示或 README.md 进行配置。${NC}"
fi
echo -e "${BLUE}================================================================${NC}\n"
