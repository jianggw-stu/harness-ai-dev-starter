import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const script = '/Users/jianggenwei/.agents/skills/insuranceagent-dev-lifecycle/scripts/mvn-verified.sh'
test('固定 Maven 工具链拒绝参数覆盖，且在启动 Maven 之前失败', () => {
  for (const args of [
    ['-s','/tmp/other-settings.xml'],['--settings=/tmp/other-settings.xml'],['-s/tmp/other-settings.xml'],
    ['-Dmaven.repo.local=/tmp/other-repo'],['-D','maven.repo.local=/tmp/other-repo'],
    ['--define=maven.repo.local=/tmp/other-repo'],['-P','!nexus-private'],['-Pother'],
    ['--activate-profiles=other'],['-Djava.home=/tmp/other-jdk'],['-U'],['--global-settings','/tmp/other-settings.xml']
  ]) {
    const result = spawnSync(script,args,{encoding:'utf8'})
    assert.equal(result.status,2,args.join(' '))
    assert.match(result.stderr,/override rejected/,args.join(' '))
    assert.equal(result.stdout,'')
  }
})

test('构建前拒绝 clean、全仓构建、无用例筛选及带上游的测试', () => {
  for (const args of [
    ['clean','compile','-pl','insuranceagent-task'], ['compile'],
    ['test','-pl','insuranceagent-task'], ['test','-pl','insuranceagent-task','-Dtest=*'],
    ['test','-pl','insuranceagent-task','-Dtest=OneTest','-am'],
    ['install','-pl','insuranceagent-task'],
    ['test','-pl','insuranceagent-task','-DskipTests','-DskipTests=false']
  ]) {
    const result = spawnSync(script,args,{encoding:'utf8'})
    assert.equal(result.status,2,args.join(' '))
    assert.match(result.stderr,/rejected clean|requires -pl|require -Dtest|must not use -am/)
    assert.equal(result.stdout,'')
  }
})

test('实际启动 Maven 时固定离线工具链和增量参数，一次聚焦测试保留全部指定用例', () => {
  const directory = mkdtempSync(join(tmpdir(),'harness-maven-'))
  try {
    const java = join(directory,'jdk')
    const maven = join(directory,'maven')
    const repo = join(directory,'repository')
    const settings = join(maven,'conf/settings.xml')
    const calls = join(directory,'calls.jsonl')
    for (const path of [join(java,'bin'),join(maven,'bin'),join(maven,'conf'),repo]) mkdirSync(path,{recursive:true})
    writeFileSync(join(java,'bin/java'),'')
    writeFileSync(settings,`<settings><localRepository>${repo}</localRepository><activeProfiles><activeProfile>nexus-private</activeProfile></activeProfiles></settings>`)
    writeFileSync(join(maven,'bin/mvn'),`#!${process.execPath}
const fs = require('node:fs')
const args = process.argv.slice(2)
fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({args,java:process.env.JAVA_HOME})+'\\n')
if (args.includes('-version')) console.log('Apache Maven 3.8.6\\nJava version: 11.0.22')
`,{mode:0o700})
    const pinned = readFileSync(script,'utf8')
      .replace('/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home',java)
      .replaceAll('/Users/jianggenwei/Documents/maven/apache-maven-3.8.6',maven)
      .replaceAll('/Users/jianggenwei/Documents/maven-work',repo)
    const isolated = join(directory,'mvn-verified.sh')
    writeFileSync(isolated,pinned,{mode:0o700})
    const result = spawnSync(isolated,['test','-pl','insuranceagent-task','-Dtest=OneTest,TwoTest'],{encoding:'utf8'})
    assert.equal(result.status,0,result.stderr)
    const invocations = readFileSync(calls,'utf8').trim().split('\n').map(line=>JSON.parse(line))
    assert.equal(invocations.length,2)
    const invocation = invocations[1]
    assert.equal(invocation.java,java)
    assert.deepEqual(invocation.args,[
      '-o','-s',settings,`-Dmaven.repo.local=${repo}`,'-P','nexus-private',
      '-Dmaven.compiler.useIncrementalCompilation=false',
      'test','-pl','insuranceagent-task','-Dtest=OneTest,TwoTest'
    ])
  } finally { rmSync(directory,{recursive:true,force:true}) }
})
