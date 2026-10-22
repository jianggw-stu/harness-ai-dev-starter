#!/usr/bin/env bash
# ==============================================================================
# AI 研发全生命周期流水线 - 一键同步更新并推送到 GitHub (含 Release 资产自动更新)
# 使用方式:
#   ./publish.sh "这里写更新说明"
#   例如: ./publish.sh "fix: 优化需求澄清流程与操作台交互"
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMIT_MSG="${1:-update: sync latest skills and harness plugins}"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}       AI 研发流水线 - 一键同步与 GitHub 全自动发布程序           ${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "提交信息: ${YELLOW}${COMMIT_MSG}${NC}\n"

# 1. 自动同步本地最新开发的 Skills (可选同步)
echo -e "${YELLOW}[1/5] 检查并同步本地最新开发的技能包...${NC}"
LOCAL_LIFECYCLE_SRC="$HOME/.agents/skills/insuranceagent-dev-lifecycle"
if [ -d "$LOCAL_LIFECYCLE_SRC" ]; then
    echo -e "  🔄 正在从本机技能目录同步最新 lifecycle 并执行自动脱敏..."
    rm -rf "$PROJECT_ROOT/skills/dev-lifecycle"
    cp -r "$LOCAL_LIFECYCLE_SRC" "$PROJECT_ROOT/skills/dev-lifecycle"
    
    # 自动执行脱敏清洗 (替换个人绝对路径、数据库、保险字样)
    python3 -c "
import os
target_dir = '$PROJECT_ROOT/skills/dev-lifecycle'
for root, dirs, files in os.walk(target_dir):
    for f in files:
        if f.endswith(('.md', '.sh', '.example', '.json', '.yaml')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as file:
                c = file.read()
            c = c.replace('/Users/jianggenwei/Documents/maven/apache-maven-3.8.6', '/xxx/path/to/apache-maven-xxx')
            c = c.replace('/Users/jianggenwei/Documents/maven-work', '/xxx/path/to/maven-work')
            c = c.replace('scheme2-mysql', 'xxx-mysql')
            c = c.replace('scheme2', 'xxx_test_db')
            c = c.replace('3307', 'xxx_port')
            c = c.replace('保险代理人 Java 仓库', '项目 Java 仓库')
            c = c.replace('保险业务', '项目业务')
            c = c.replace('保险项目', '项目')
            c = c.replace('保险、', '')
            c = c.replace('保险或', '')
            c = c.replace('在 insuranceagent 工作区', '在项目工程工作区')
            c = c.replace('insuranceagent', 'project')
            with open(p, 'w', encoding='utf-8') as file:
                file.write(c)
"
    echo -e "  ${GREEN}✔ Skills 同步与安全脱敏完成${NC}"
fi

# 2. 自动同步本地最新的 Harness 操作台插件
echo -e "\n${YELLOW}[2/5] 检查并同步 Harness 操作台插件...${NC}"
LOCAL_PLUGIN_SRC="$HOME/Documents/deepseek-harness/default-workspace/auto-dev-flow"
if [ -d "$LOCAL_PLUGIN_SRC" ]; then
    echo -e "  🔄 正在同步最新的 auto-dev-flow 插件并安全补丁..."
    rm -rf "$PROJECT_ROOT/harness-plugins/auto-dev-flow"
    mkdir -p "$PROJECT_ROOT/harness-plugins/auto-dev-flow"
    cp -r "$LOCAL_PLUGIN_SRC"/* "$PROJECT_ROOT/harness-plugins/auto-dev-flow/"
    
    # 补丁：安全动态加载 pingcode，去除硬编码
    python3 -c "
target_file = '$PROJECT_ROOT/harness-plugins/auto-dev-flow/index.js'
with open(target_file, 'r', encoding='utf-8') as f:
    code = f.read()

old_import = \"import { getWorkItem, listMyWorkItems } from '/Users/jianggenwei/.agents/skills/pingcode-personal/scripts/pingcode.mjs'\"
new_import = \"\"\"import os from 'node:os'
import path from 'node:path'

let getWorkItem = async () => null
let listMyWorkItems = async () => []

try {
  const possiblePaths = [
    path.resolve(os.homedir(), '.agents/skills/pingcode-personal/scripts/pingcode.mjs'),
    path.resolve(os.homedir(), '.agents/skills/pingcode/scripts/pingcode.mjs')
  ]
  const targetScript = possiblePaths.find(p => existsSync(p))
  if (targetScript) {
    const mod = await import(targetScript)
    if (mod.getWorkItem) getWorkItem = mod.getWorkItem
    if (mod.listMyWorkItems) listMyWorkItems = mod.listMyWorkItems
  }
} catch (e) {
  console.warn('[auto-dev-flow] PingCode script optional load notice:', e.message)
}\"\"\"

if old_import in code:
    code = code.replace(old_import, new_import)
code = code.replace('\$insuranceagent-dev-lifecycle', '\$dev-lifecycle')

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(code)
"
    echo -e "  ${GREEN}✔ 操作台插件同步与安全改造完成${NC}"
fi

# 3. 重新打包 Release 资产 (skills.tar.gz + harness-plugins.tar.gz)
echo -e "\n${YELLOW}[3/5] 重新打包 Release 压缩包资产...${NC}"
TMP_SKILLS="/tmp/skills.tar.gz"
TMP_PLUGINS="/tmp/harness-plugins.tar.gz"

cd "$PROJECT_ROOT/skills"
tar -czf "$TMP_SKILLS" *
echo -e "  ✔ 已生成最新的 skills.tar.gz ($(du -h "$TMP_SKILLS" | awk '{print $1}'))"

cd "$PROJECT_ROOT/harness-plugins"
tar -czf "$TMP_PLUGINS" auto-dev-flow
echo -e "  ✔ 已生成最新的 harness-plugins.tar.gz ($(du -h "$TMP_PLUGINS" | awk '{print $1}'))"

# 4. Git 提交并推送到 GitHub 仓库
echo -e "\n${YELLOW}[4/5] 提交源码变更并推送到 GitHub 远程仓库...${NC}"
cd "$PROJECT_ROOT"
git add .
if git diff --staged --quiet; then
    echo -e "  ℹ 源码文件没有变更，跳过 git commit。"
else
    git commit -m "$COMMIT_MSG"
    git push origin main
    echo -e "  ${GREEN}✔ 源码已成功推送至 GitHub main 分支！${NC}"
fi

# 5. 上传并覆盖 GitHub Release 资产
echo -e "\n${YELLOW}[5/5] 上传最新资产并同步 GitHub Release (v1.0.0)...${NC}"
python3 -c "
import urllib.request
import json
import os

token_file = os.path.expanduser('~/.git-credentials')
if not os.path.exists(token_file):
    print('  ⚠ 未找到 ~/.git-credentials，跳过 Release 资产上传')
    exit(0)

with open(token_file, 'r') as f:
    line = f.readline()
    token = line.split(':')[-1].split('@')[0].strip()

repo = 'jianggw-stu/harness-ai-dev-starter'
headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Release-Publisher'
}

# 获取 release
req_get = urllib.request.Request(f'https://api.github.com/repos/{repo}/releases/tags/v1.0.0', headers=headers)
try:
    with urllib.request.urlopen(req_get) as resp:
        release = json.loads(resp.read().decode('utf-8'))
        upload_url = release['upload_url'].split('{')[0]
        assets = release.get('assets', [])
except Exception as e:
    print('  ⚠ 获取 Release 失败:', e)
    exit(0)

# 删除旧资产函数
for asset in assets:
    if asset['name'] in ['skills.tar.gz', 'harness-plugins.tar.gz']:
        req_del = urllib.request.Request(asset['url'], headers=headers, method='DELETE')
        try:
            with urllib.request.urlopen(req_del) as d_resp:
                pass
        except Exception:
            pass

# 上传新资产
for name, fpath in [('skills.tar.gz', '/tmp/skills.tar.gz'), ('harness-plugins.tar.gz', '/tmp/harness-plugins.tar.gz')]:
    upload_endpoint = f'{upload_url}?name={name}'
    with open(fpath, 'rb') as af:
        adata = af.read()
    u_headers = {
        'Authorization': f'token {token}',
        'Content-Type': 'application/gzip',
        'User-Agent': 'Release-Publisher'
    }
    req_u = urllib.request.Request(upload_endpoint, data=adata, headers=u_headers, method='POST')
    try:
        with urllib.request.urlopen(req_u) as resp:
            print(f'  ✔ 已成功更新 Release 资产: {name}')
    except Exception as e:
        print(f'  ⚠ 上传资产 {name} 失败:', e)
"

rm -f /tmp/skills.tar.gz /tmp/harness-plugins.tar.gz

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 同步与发布全部完成！${NC}"
echo -e "  • GitHub 仓库源码已更新"
echo -e "  • GitHub Release 资产已自动刷新"
echo -e "  • 其他任何人运行 curl 一键安装命令将自动获取到您的最新版本！"
echo -e "${GREEN}================================================================${NC}\n"
