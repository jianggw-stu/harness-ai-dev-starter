#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 研发流水线开源脚手架 - 自动化脱敏与敏感数据校验门禁
在任何提交和发布之前，执行全量字符串替换与敏感关键词深度扫描。
"""

import os
import sys
import re

SENSITIVE_REPLACEMENTS = [
    # 1. 绝对路径与用户名脱敏
    ('/Users/jianggenwei/Documents/maven/apache-maven-3.8.6', '/path/to/apache-maven-xxx'),
    ('/Users/jianggenwei/Documents/maven-work', '/path/to/maven-work'),
    ('/Users/jianggenwei', '~'),
    ('jianggenwei', 'developer'),

    # 2. 数据库与端口脱敏
    ('scheme2-mysql', 'project-mysql'),
    ('Scheme2DockerVerificationTest', 'ProjectDockerVerificationTest'),
    ('scheme2', 'test_db'),
    ('3307', '3306'),

    # 3. 业务专有词汇脱敏
    ('Insuranceagent 开发全流程', '项目研发全生命周期'),
    ('insuranceagent-dev-lifecycle', 'dev-lifecycle'),
    ('project-dev-lifecycle', 'dev-lifecycle'),
    ('保险代理人 Java 仓库', '项目 Java 仓库'),
    ('保险代理人', '项目工程'),
    ('保险业务', '项目业务'),
    ('保险项目', '项目'),
    ('保险或', ''),
    ('保险、', ''),
    ('、保险', ''),
    ('在 insuranceagent 工作区', '在项目工程工作区'),
    ('Insuranceagent', 'Project'),
    ('InsuranceAgent', 'Project'),
    ('insuranceagent', 'project'),
    ('保险', '业务')
]

# 严格门禁：禁止出现在开源仓库中的敏感词/模式 (不区分大小写正则)
FORBIDDEN_PATTERNS = [
    (r'jianggenwei', '包含开发者个人用户名 (jianggenwei)'),
    (r'insuranceagent', '包含业务项目代号 (insuranceagent)'),
    (r'保险', '包含业务限定词 (保险)'),
    (r'scheme2', '包含本地数据库名称 (scheme2)'),
    (r'ghp_[A-Za-z0-9_]{30,}', '包含疑似 GitHub Personal Access Token'),
    (r'-----BEGIN (?:RSA )?PRIVATE KEY-----', '包含私钥凭据内容')
]

def sanitize_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return # 二进制文件跳过

    original = content
    for old, new in SENSITIVE_REPLACEMENTS:
        content = content.replace(old, new)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

def check_sensitive_data(target_dir):
    violations = []
    for root, dirs, files in os.walk(target_dir):
        # 忽略 .git 目录
        if '.git' in root:
            continue
        for f in files:
            # 忽略发布与门禁脚本自身
            if f in ('publish.sh', 'security_guard.py'):
                continue
            # 仅检查文本与源码文件
            if f.endswith(('.md', '.sh', '.js', '.json', '.yaml', '.yml', '.example', '.svg', '.html', '.css')):
                file_path = os.path.join(root, f)
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        for line_num, line in enumerate(file, 1):
                            for pattern, desc in FORBIDDEN_PATTERNS:
                                if re.search(pattern, line, re.IGNORECASE):
                                    rel_path = os.path.relpath(file_path, target_dir)
                                    violations.append((rel_path, line_num, desc, line.strip()))
                except UnicodeDecodeError:
                    pass
    return violations

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    target = sys.argv[2] if len(sys.argv) > 2 else '.'

    if mode in ('sanitize', 'all'):
        for root, dirs, files in os.walk(target):
            if '.git' in root:
                continue
            for f in files:
                if f in ('publish.sh', 'security_guard.py'):
                    continue
                if f.endswith(('.md', '.sh', '.js', '.json', '.yaml', '.yml', '.example', '.svg', '.html', '.css')):
                    sanitize_file(os.path.join(root, f))
        print(f"✔ 已对目标目录完成全量自动脱敏替换: {target}")

    if mode in ('check', 'all'):
        violations = check_sensitive_data(target)
        if violations:
            print(f"\n❌ [安全门禁警报] 在目标仓库中检测到 {len(violations)} 处潜在敏感数据！已阻止提交：")
            for rel_path, line_num, desc, line in violations[:20]: # 最多展示 20 条
                print(f"  • {rel_path}:{line_num} -> [{desc}]")
                print(f"    行内容: {line[:100]}")
            if len(violations) > 20:
                print(f"  ... 另有 {len(violations) - 20} 处未展开展示")
            sys.exit(1)
        else:
            print(f"✔ [安全门禁通过] 全量扫描通过，0 敏感数据残留！")
