import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await realpath(await mkdtemp(join(tmpdir(), 'harness-flow-')))
const worktree = join(directory,'workspace')
await mkdir(worktree)
const reportPath = join(worktree,'JGA-1269.html')
await writeFile(reportPath,'<!doctype html><html><body>需求与测试用例</body></html>')
const fixturePath = join(directory, 'state.json')
const callsPath = join(directory, 'calls.log')
const command = join(directory, 'orca')
await writeFile(command, `#!${process.execPath}
const fs = require('node:fs')
const file = process.env.HARNESS_FLOW_FIXTURE
const state = JSON.parse(fs.readFileSync(file, 'utf8'))
const args = process.argv.slice(2)
const value = key => args[args.indexOf(key) + 1]
const operation = args.slice(0, 2).join(' ')
fs.appendFileSync(process.env.HARNESS_FLOW_CALLS, operation + '\\n')
let result
if (state.fail === operation) { console.log(JSON.stringify({ok:false,error:{message:'fixture failure'}})); process.exit(1) }
switch (operation) {
  case 'repo list': result = {repos:[state.repo]}; break
  case 'terminal list': result = {terminals:[{handle:'term_coordinator'}, ...state.workers.map(worker => ({handle:worker.agentTerminalHandle}))]}; break
  case 'orchestration run-list': result = {runs:[state.run]}; break
  case 'orchestration worker-list': result = {workers:state.workers}; break
  case 'orchestration worker-show': result = {worker:{startOptions:{launch:{effective:state.launches[value('--dispatch')]}}}}; break
  case 'orchestration task-list': result = {tasks:state.tasks}; break
  case 'orchestration check': result = {messages:state.messages.filter(item => !item.outgoing)}; break
  case 'orchestration inbox': result = {messages:state.messages}; break
  case 'orchestration gate-list': result = {gates:state.gates}; break
  case 'worktree show': result = {worktree:state.worktree}; break
  case 'worktree set': state.worktree.comment = value('--comment'); fs.writeFileSync(file, JSON.stringify(state)); result = {worktree:state.worktree}; break
  case 'terminal close': {
    const worker = state.workers.find(item => item.agentTerminalHandle === value('--terminal'))
    if (worker) { worker.dispatchStatus = 'completed'; worker.projection.outcome = 'failed' }
    fs.writeFileSync(file, JSON.stringify(state)); result = {close:{ptyKilled:true}}; break
  }
  case 'orchestration worker-abandon': {
    const worker = state.workers.find(item => item.dispatchId === value('--dispatch'))
    if (worker) { worker.dispatchStatus = 'abandoned'; worker.projection.outcome = 'failed' }
    fs.writeFileSync(file, JSON.stringify(state)); result = {}; break
  }
  case 'orchestration task-update': {
    const task = state.tasks.find(item => item.id === value('--id'))
    task.status = value('--status'); task.result = value('--result')
    fs.writeFileSync(file, JSON.stringify(state)); result = {task}; break
  }
  case 'terminal read': result = {terminal:{status:'running'}}; break
  case 'terminal send':
    state.sends = [...(state.sends || []),value('--text')]
    fs.writeFileSync(file, JSON.stringify(state)); result = {send:{accepted:true,stage:'turn_started'}}; break
  case 'orchestration gate-resolve': {
    const gate = state.gates.find(item => item.id === value('--id'))
    gate.status = 'resolved'; gate.resolution = value('--resolution')
    fs.writeFileSync(file, JSON.stringify(state)); result = {gate}; break
  }
  case 'orchestration reply': {
    state.messages.push({id:'msg_reply',from_handle:'run:'+state.run.id,run_id:state.run.id,type:'status',thread_id:value('--id'),body:value('--body'),outgoing:true})
    fs.writeFileSync(file, JSON.stringify(state)); result = {}; break
  }
  default: throw new Error('Unexpected Orca operation: ' + args.join(' '))
}
console.log(JSON.stringify({ok:true,result}))
`, { mode: 0o700 })
process.env.ORCA_CLI_COMMAND = command
process.env.HARNESS_FLOW_FIXTURE = fixturePath
process.env.HARNESS_FLOW_CALLS = callsPath
const { apply, lifecyclePrompt } = await import(process.env.HARNESS_FLOW_MODULE || '../index.js')
const handlers = new Map()
apply({ inject(_names, callback) {
  callback({ effect(callback) { callback() }, webServer: { register(route) {
    handlers.set(route.path, route.handler)
    return () => {}
  } } })
} })
after(() => rm(directory, { recursive: true, force: true }))

test('新流程提示要求把唯一推荐项写进 Orca ask 的可见选项', async () => {
  const prompt = lifecyclePrompt('JGA-1269', '后台上传补图', '需求', {identifier:'JGA-1269'}, '', '/repo')
  assert.match(prompt, /有限选择提供 2–5 个简短 --options，并把唯一推荐项直接标为“（推荐）”写进对应选项文本/)
  assert.match(prompt, /用户答复明确时直接记录并继续，不重复复述让用户确认/)
  assert.match(prompt, /可选代码定位线索问题，包含“不知道，由模型自行查找”/)
  assert.match(prompt, /结算等无关协作者仅使用最小测试替身正常返回/)
  assert.match(prompt, /完整编译成功证据时核对并复用，不另派复核 Worker 或重复编译/)
  assert.match(prompt, /图片字段用图片 DTO\/既有最小图片夹具/)
  assert.match(prompt, /完全排除在本阶段测试范围、testCases、QA 结果和阻断说明之外/)
  assert.match(prompt, /excludedTestCaseIds/)
  assert.match(prompt, /不通过 Harness ask 索要外部返回/)
  assert.match(prompt, /默认由 Grok grok-4\.7 开发和返修/)
  assert.match(prompt, /用户明确指定 Command Code 开发时才用/)
  assert.match(prompt, /cmd --dangerously-skip-permissions/)
  assert.doesNotMatch(prompt, /本轮流程测速不使用 Grok/)
})

const runId = 'run_aaaaaaaaaaaa'
const worktreeId = `repo-test::${worktree}`
function fixture() {
  const task = (id, title, status = 'completed', result = '') => ({id,task_title:title,status,result})
  const worker = (id, agent, model) => ({
    taskId:id,runId,dispatchId:`ctx_${id}`,agentTerminalHandle:`term_${id}`,dispatchStatus:'completed',
    resource:{worktreeId},projection:{outcome:'succeeded',provider:{id:agent,model,effort:agent === 'grok' ? 'medium':'high'},workspace:{id:worktreeId}}
  })
  return {
    repo:{id:'repo-test',kind:'git',gitRemoteIdentity:{canonicalKey:'git.example.test/agent/insuranceagent'}},
    run:{id:runId,coordinator_handle:'term_coordinator',objective:'JGA-1269'},
    worktree:{comment:'PingCode JGA-1269 · 当前阶段：MR 评审',linkedGitLabMR:3397},
    tasks:[task('analysis','需求分析', 'completed', JSON.stringify({outcome:'succeeded',reportPath,testCases:[{id:'TC-01',title:'上传生成报告',expected:'生成报告'}]})),
      task('implementation','实现：JGA-1269'),task('qa','独立 QA', 'failed','Harness 用户跳过验证：本轮未验证'),
      task('review','JGA-1269 独立 GitLab MR 评审与回写'),task('decision','MR 中风险处理决策','completed','结束本轮流程验证')],
    workers:[worker('review','codex','gpt-6-luna'),worker('qa','codex','gpt-6-luna'),
      worker('implementation','grok','grok-4.7'),worker('analysis','codex','gpt-6-luna')],
    messages:[{id:'msg_review',run_id:runId,type:'worker_done',body:'',payload:JSON.stringify({
      taskId:'review',outcome:'succeeded',noteUrl:'https://git.example.test/agent/insuranceagent/-/merge_requests/3397#note_1',
      body:'远程评审已完成',mr:{draft:true},blocking:false,severity:{medium:1},finding:'并发补图可能重复发起识别'
    })}],gates:[],launches:{}
  }
}
async function call(path, body) {
  const headers = {host:'localhost'}
  const request = {method:body ? 'POST' : 'GET',headers,url:path,
    async *[Symbol.asyncIterator]() { if (body) yield JSON.stringify(body) }}
  let status
  let payload
  await handlers.get(path.split('?')[0])(request, {writeHead(code){status=code},end(value){
    try { payload=JSON.parse(value) } catch { payload={html:String(value)} }
  }})
  return {status,...payload}
}
const identity = {bugId:'JGA-1269',repoId:'repo-test',worktree,runId,coordinatorTerminal:'term_coordinator'}
const stateUrl = '/auto-dev-flow/orca/state?' + new URLSearchParams(identity)
async function state(data) {
  await writeFile(fixturePath, JSON.stringify(data))
  return call(stateUrl)
}

test('既有调用说明从开发持久结果恢复，QA 更新覆盖情况，排除其他 Dispatch 且不改变 Review 就绪状态', async () => {
  const data = fixture()
  const note = {caller:'saveForm',callee:'existingMapper.update',purpose:'填充本次字段',verification:'待 QA 核对',impact:'未验证并发场景'}
  data.tasks.find(task => task.id === 'implementation').result = JSON.stringify({dependencyNotes:[note]})
  data.messages.push({id:'wrong-dispatch',run_id:runId,type:'worker_done',payload:{
    taskId:'qa',dispatchId:'ctx_other',dependencyNotes:[{...note,callee:'unrelated.call'}]
  }})
  let result = await state(data)
  assert.deepEqual(result.state.dependencyNotes,[note])
  const ready = result.state.reviewReady
  data.messages.push({id:'qa-notes',run_id:runId,type:'worker_done',payload:{
    taskId:'qa',dispatchId:'ctx_qa',dependencyNotes:[{...note,verification:'真实 Mapper，TC-01'}]
  }})
  result = await state(data)
  assert.deepEqual(result.state.dependencyNotes,[{...note,verification:'真实 Mapper，TC-01'}])
  assert.equal(result.state.reviewReady,ready)
  data.messages = []
  data.tasks.find(task => task.id === 'implementation').result = ''
  assert.equal((await state(data)).state.dependencyNotes,null)
  data.tasks.find(task => task.id === 'implementation').result = JSON.stringify({dependencyNotes:[]})
  assert.deepEqual((await state(data)).state.dependencyNotes,[])
})

test('需求报告仅在说明中回传路径时，从已生成 HTML 恢复页面和编号用例', async () => {
  const data = fixture()
  const folder=join(worktree,'.harness-dist/JGA-1269')
  await mkdir(folder,{recursive:true})
  await writeFile(join(folder,'需求结论.html'),`<!doctype html><html><body><h1>需求与测试用例</h1>
<textarea id="am-source" hidden>| 编号 | 场景与操作 | 预期 |
|---|---|---|
| TC-01 | 上传图片 | 生成报告 &amp; 保留图片 |
| TC-02 | 查看综合内容 | 人工内容保持不变 |
</textarea></body></html>`)
  const body='已生成需求页面，reportPath: .harness-dist/JGA-1269/需求结论.html；testCases: [{id:TC-01,title:上传图片}]；等待确认。'
  data.tasks.find(task=>task.id==='analysis').result=JSON.stringify({outcome:'succeeded',body,reportPath:null,filesModified:[]})
  data.messages.push({id:'analysis-done',run_id:runId,type:'worker_done',body,payload:{taskId:'analysis',dispatchId:'ctx_analysis',outcome:'succeeded'}})
  const result=await state(data)
  assert.equal(result.state.review.reportPath,join(folder,'需求结论.html'))
  assert.equal(result.state.review.reportError,'')
  assert.deepEqual(result.state.review.testCases,[
    {id:'TC-01',title:'上传图片',expected:'生成报告 & 保留图片'},
    {id:'TC-02',title:'查看综合内容',expected:'人工内容保持不变'}
  ])
  const report=await call('/auto-dev-flow/orca/report?'+new URLSearchParams(identity))
  assert.equal(report.status,200)
  assert.match(report.html,/需求与测试用例/)
})

test('需求 Worker 临时报告经真实文件交接后可展示，临时目录消失后刷新仍可确认', async () => {
  const data = fixture()
  const taskId = 'task_' + directory.split('/').pop().replaceAll('-', '_')
  const scratch = join(tmpdir(), `orca-${taskId}`)
  await mkdir(scratch)
  try {
    const temporaryReport = join(scratch, 'JGA-1269-review.html')
    await writeFile(temporaryReport, '<!doctype html><html><body><h1>需求评审交接</h1><p>TC-01 上传后生成单项报告</p></body></html>')
    data.worktree.comment = 'PingCode JGA-1269'
    data.tasks = [{id:taskId, task_title:'JGA-1269 需求分析', status:'completed', result:JSON.stringify({
      outcome:'succeeded', reportPath:temporaryReport, testCases:[{id:'TC-01',title:'上传',expected:'生成单项报告'}]
    })}]
    data.workers = [{...data.workers.find(worker => worker.taskId === 'analysis'), taskId, dispatchId:'ctx_report_smoke'}]
    data.messages = []
    let result = await state(data)
    assert.equal(result.state.review.reportError, '')
    assert.match(result.state.review.reportPath, /\.harness-dist\/JGA-1269\//)
    assert.match((await call('/auto-dev-flow/orca/report?' + new URLSearchParams(identity))).html, /需求评审交接/)
    await rm(scratch, {recursive:true})
    result = await call(stateUrl)
    assert.equal(result.state.review.reportError, '')
    assert.equal((await call('/auto-dev-flow/orca/requirements/confirm', identity)).status, 200)
    assert.match(JSON.parse(await readFile(fixturePath, 'utf8')).sends.at(-1), /用户已明确确认 JGA-1269/)
  } finally {
    await rm(scratch, {recursive:true, force:true})
  }
})

test('页面缺失、没有编号用例或路径越界时，显示错误并阻止确认需求', async () => {
  for(const review of [
    {reportPath:join(worktree,'missing.html'),testCases:[{id:'TC-01',title:'上传图片',expected:'生成报告'}]},
    {reportPath,testCases:[]},
    {reportPath:join(directory,'outside.html'),testCases:[{id:'TC-01',title:'上传图片',expected:'生成报告'}]}
  ]) {
    await writeFile(join(directory,'outside.html'),'<!doctype html><html>其他任务报告</html>')
    const data=fixture()
    data.tasks.find(task=>task.id==='analysis').result=JSON.stringify({outcome:'succeeded',...review})
    const result=await state(data)
    assert.ok(result.state.review.reportError)
    const confirmation=await call('/auto-dev-flow/orca/requirements/confirm',identity)
    assert.equal(confirmation.status,502)
    assert.match(confirmation.error,/评审页|测试用例/)
  }
})

test('QA 标题截断时按已派发 Task 首行识别，Gate 停止决定显示跳过并开放 Review', async () => {
  const data=fixture()
  data.worktree={comment:'开发已完成；Harness 决定停止安全模块复测，QA 阻断。'}
  data.tasks=data.tasks.filter(task=>!['review','decision'].includes(task.id))
  data.workers=data.workers.filter(worker=>worker.taskId!=='review')
  const qa=data.tasks.find(task=>task.id==='qa')
  qa.task_title='目标：在当前精确 worktree /Users/example/codex-jga...'
  qa.spec='目标：在当前精确 worktree 对本次变更做独立 QA。\n不改生产代码。'
  qa.status='failed'
  qa.result=JSON.stringify({outcome:'failed',body:'测试源码引用不存在类型，尚未运行数据库验收。',testCases:[{id:'TC-01',status:'not_run'}]})
  data.tasks.push({id:'qa-decision',task_title:'JGA-1269 QA 决策',status:'completed'})
  let result=await state(data)
  assert.equal(result.state.qa.taskId,'qa')
  assert.equal(result.state.qa.status,'failed')
  assert.equal(result.state.reviewReady,false)
  data.gates.push({id:'gate_stop',run_id:runId,task_id:'qa-decision',status:'resolved',
    question:'是否授权安全模块再次定向 QA？',resolution:'停止：不再运行安全模块，记录 QA 阻断，TC-01 至 TC-03 维持未验证'})
  result=await state(data)
  assert.equal(result.state.qa.skipped,true)
  assert.equal(result.state.qa.unverified,true)
  assert.equal(result.state.qa.crossValidated,false)
  assert.equal(result.state.stage,'mrPreparation')
  assert.equal(result.state.reviewReady,true)
  assert.equal(result.state.reviewSubmitted,false)
})

test('仅完成 QA 决策还未派发 QA 时，明确停止同样显示用户跳过而非未开始', async () => {
  const data=fixture()
  data.worktree={comment:'PingCode JGA-1269 · 当前阶段：待提交 Review · 独立验证：用户跳过，未验证'}
  data.tasks=data.tasks.filter(task=>!['qa','review','decision'].includes(task.id))
  data.workers=data.workers.filter(worker=>!['qa','review'].includes(worker.taskId))
  const result=await state(data)
  assert.equal(result.state.qa.skipped,true)
  assert.equal(result.state.qa.unverified,true)
  assert.equal(result.state.reviewReady,true)
  assert.equal(result.state.reviewSubmitted,false)
})

test('Harness 选择停止 QA 后可提交 Review，待提交阶段不被误认为已提交', async () => {
  const data=fixture()
  data.worktree={comment:'PingCode JGA-1269 · 当前阶段：测试'}
  data.tasks=data.tasks.filter(task=>!['review','decision'].includes(task.id))
  data.workers=data.workers.filter(worker=>worker.taskId!=='review')
  data.tasks.push({id:'qa-decision',task_title:'QA 决策',status:'blocked'})
  data.gates.push({id:'gate_stop',run_id:runId,task_id:'qa-decision',status:'pending',question:'是否再次运行安全模块 QA？'})
  await state(data)
  const answer=await call('/auto-dev-flow/orca/answer',{...identity,messageId:'gate_stop',answer:'停止：不再运行安全模块，保持未验证'})
  assert.equal(answer.status,200)
  const after=await call(stateUrl)
  assert.equal(after.state.reviewReady,true)
  assert.equal(after.state.reviewSubmitted,false)
  const submitted=await call('/auto-dev-flow/orca/review/submit',identity)
  assert.equal(submitted.status,200)
  assert.notEqual(submitted.alreadySubmitted,true)
  let saved=JSON.parse(await readFile(fixturePath,'utf8'))
  assert.match(saved.sends.at(-1),/Harness 用户已点击.*提交 Review/)
  assert.match(saved.worktree.comment,/用户跳过，未验证/)
  const count=saved.sends.length
  const duplicate=await call('/auto-dev-flow/orca/review/submit',identity)
  assert.equal(duplicate.alreadySubmitted,true)
  saved=JSON.parse(await readFile(fixturePath,'utf8'))
  assert.equal(saved.sends.length,count)
})

test('对话要求跳过测试并进入 Review 后，持久推进阶段且保留未验证状态', async () => {
  const data = fixture()
  data.worktree.comment = 'PingCode JGA-1269 · 当前阶段：测试'
  data.tasks = data.tasks.filter(task => !['review', 'decision'].includes(task.id))
  data.workers = data.workers.filter(worker => worker.taskId !== 'review')
  const qa = data.tasks.find(task => task.id === 'qa')
  qa.status = 'completed'
  qa.result = JSON.stringify({outcome:'succeeded',testCases:[{id:'TC-01',status:'not_run'}]})
  data.tasks.push({id:'conversation-followup',task_title:'JGA-1269 简单用例测速',status:'blocked'})

  const before = await state(data)
  assert.equal(before.state.stage,'tests')
  const sent = await call('/auto-dev-flow/orca/continue', {...identity,instruction:'停止测试直接下一步'})
  assert.equal(sent.status,200)
  assert.equal(sent.skipped,true)
  assert.equal(sent.verification,'unverified')

  const after = await call(stateUrl)
  assert.equal(after.state.stage,'mrPreparation')
  assert.equal(after.state.qaSkipped,true)
  assert.equal(after.state.qa.unverified,true)
  assert.equal(after.state.reviewReady,true)
  const regressed = await call('/auto-dev-flow/orca/progress', {...identity,stage:'tests'})
  assert.equal(regressed.status,502)
  assert.match(regressed.error,/不能将阶段退回测试/)
})

test('测试 Worker 执行中收到跳过指令时，先停止 Worker 再持久推进阶段', async () => {
  const data = fixture()
  data.worktree.comment = 'PingCode JGA-1269 · 当前阶段：测试'
  data.tasks = data.tasks.filter(task => !['review', 'decision'].includes(task.id))
  data.workers = data.workers.filter(worker => worker.taskId !== 'review')
  const qa = data.tasks.find(task => task.id === 'qa')
  qa.status = 'dispatched'
  qa.result = ''
  const qaWorker = data.workers.find(worker => worker.taskId === 'qa')
  qaWorker.dispatchId = 'ctx_a123'
  qaWorker.dispatchStatus = 'dispatched'
  qaWorker.projection.outcome = 'in_progress'
  data.tasks.push({id:'conversation-followup',task_title:'JGA-1269 简单用例测速',status:'blocked'})

  await state(data)
  const result = await call('/auto-dev-flow/orca/interrupt', {
    ...identity, dispatchId:'ctx_a123', reason:'跳过测试直接下一步'
  })
  assert.equal(result.status,200,JSON.stringify(result))
  assert.equal(result.stopped,true)
  assert.equal(result.skipped,true)
  assert.equal(result.verification,'unverified')
  const after = await call(stateUrl)
  assert.equal(after.state.stage,'mrPreparation')
  assert.equal(after.state.qaSkipped,true)
  assert.equal(after.state.qa.unverified,true)
})

test('评审已完成、决策已结束：旧备注和 Draft 不使状态退回评审中，QA 仍未验证', async () => {
  const result = await state(fixture())
  assert.equal(result.status,200)
  assert.equal(result.state.stage,'mrReviewed')
  assert.equal(result.state.flowStatus,'completed')
  assert.equal(result.state.mrReview.draft,true)
  assert.equal(result.state.qa.skipped,true)
  assert.equal(result.state.mrReview.summary,'远程评审已完成')
})

test('最新 MR 独立复审完成后显示评审完成，定向 QA 不覆盖先前跳过的数据库验收', async () => {
  const data = fixture()
  data.tasks = data.tasks.filter(task => task.id !== 'decision')
  const dev = data.workers.find(worker => worker.taskId === 'implementation')
  const qa = data.workers.find(worker => worker.taskId === 'qa')
  const review = data.workers.find(worker => worker.taskId === 'review')
  data.tasks.push(
    {id:'repair',task_title:'JGA-1269 修复 MR 高阻断',status:'completed'},
    {id:'targeted',task_title:'JGA-1269 Review 高阻断定向验证',spec:'JGA-1269 Review 高阻断定向 QA',status:'completed'},
    {id:'rereview',task_title:'JGA-1269 MR !3405 独立复审',status:'completed'}
  )
  data.workers.unshift(
    {...review,taskId:'rereview',dispatchId:'ctx_rereview'},
    {...qa,taskId:'targeted',dispatchId:'ctx_targeted'},
    {...dev,taskId:'repair',dispatchId:'ctx_repair'}
  )
  data.messages.push({id:'msg_rereview',run_id:runId,type:'worker_done',payload:JSON.stringify({
    taskId:'rereview',dispatchId:'ctx_rereview',outcome:'succeeded',reviewResult:'no_blocking_findings',
    noteUrl:'https://git.example.test/agent/insuranceagent/-/merge_requests/3405#note_54897',mr:{draft:true}
  })})
  const result = await state(data)
  assert.equal(result.status,200)
  assert.equal(result.state.stage,'mrReviewed')
  assert.equal(result.state.mrReview.taskId,'rereview')
  assert.equal(result.state.mrReview.noteUrl,'https://git.example.test/agent/insuranceagent/-/merge_requests/3405#note_54897')
  assert.equal(result.state.mrReview.current,true)
  assert.equal(result.state.qa.taskId,'targeted')
  assert.equal(result.state.qa.unverified,true)
})

test('任务耗时按 Orca UTC 创建与完成时间计算，排除未启动任务', async () => {
  const data=fixture()
  const analysis=data.tasks.find(task=>task.id==='analysis')
  analysis.created_at='2026-10-27 01:49:48'
  analysis.completed_at='2026-10-27T01:55:37.000Z'
  data.tasks.push({id:'pending',task_title:'未来任务',status:'pending',created_at:'2026-10-27 01:56:00'})
  const result=await state(data)
  assert.equal(result.status,200)
  assert.deepEqual(result.state.taskTimings,[{id:'analysis',title:'需求分析',status:'completed',
    startedAt:'2026-10-27T01:49:48.000Z',finishedAt:'2026-10-27T01:55:37.000Z',durationMs:349000}])
})

test('状态刷新只读取一次 worktree，并展示真实执行过的任务间隔', async () => {
  const data = fixture()
  data.tasks.find(task => task.id === 'analysis').created_at = '2026-10-27 01:00:00'
  data.tasks.find(task => task.id === 'analysis').completed_at = '2026-10-27T01:02:00Z'
  const qa = data.tasks.find(task => task.id === 'qa')
  qa.status = 'ready'
  qa.created_at = '2026-10-27 01:03:30'
  qa.completed_at = '2026-10-27T01:05:00Z'
  await writeFile(callsPath, '')
  const result = await state(data)
  assert.equal(result.status, 200)
  assert.equal(result.state.taskTimings.find(item => item.id === 'qa').gapMs, 90000)
  assert.equal((await readFile(callsPath, 'utf8')).split('\n').filter(line => line === 'worktree show').length, 1)
})

test('Gate 不在未读消息中时仍展示快捷选项，答复后持久解决并通知 coordinator', async () => {
  const data = fixture()
  data.tasks.at(-1).status = 'blocked'
  data.gates = [{id:'gate_1',run_id:runId,task_id:'decision',status:'pending',question:'如何处理？',options:'["记录风险并结束本轮流程验证","返修"]'}]
  let result = await state(data)
  assert.equal(result.state.flowStatus,'waiting')
  assert.equal(result.state.questions[0].kind,'gate')
  assert.deepEqual(result.state.questions[0].options,['记录风险并结束本轮流程验证','返修'])
  result = await call('/auto-dev-flow/orca/answer', {...identity,messageId:'gate_1',answer:'记录风险并结束本轮流程验证'})
  assert.equal(result.status,200)
  assert.equal(result.coordinatorNotified,true)
  assert.equal(JSON.parse(await readFile(fixturePath,'utf8')).gates[0].status,'resolved')
  result = await call(stateUrl)
  assert.equal(result.state.questions.length,0)
  assert.equal(result.state.flowStatus,'completed')
})

test('已读取但未答复的 Ask 不消失；同线程实际答复后才关闭', async () => {
  const data = fixture()
  data.tasks.push({id:'scope',task_title:'范围决策',status:'blocked'})
  data.messages.push({id:'msg_scope',run_id:runId,type:'question',read:1,thread_id:'msg_scope',body:'入口在哪？',payload:{taskId:'scope',options:['入口 A','入口 B']}})
  let result = await state(data)
  assert.equal(result.state.questions.length,1)
  result = await call('/auto-dev-flow/orca/answer',{...identity,messageId:'msg_scope',answer:'入口 A'})
  assert.equal(result.status,200)
  result = await call(stateUrl)
  assert.equal(result.state.questions.length,0)
})

test('本地业务范围问题可在 Harness 答复并原样持久回复同一线程', async () => {
  const data = fixture()
  data.tasks.push({id:'qa-scope',task_title:'独立 QA 范围确认',status:'blocked'})
  data.messages.push({id:'msg_dify_sample',run_id:runId,type:'question',thread_id:'msg_dify_sample',
    body:'本轮改动是否包含报告合并字段？',payload:{taskId:'qa-scope'}})
  const before = await state(data)
  assert.equal(before.state.flowStatus,'waiting')
  assert.equal(before.state.questions[0].id,'msg_dify_sample')
  const answer = '不包含，只改单项报告持久化。'
  const result = await call('/auto-dev-flow/orca/answer',{...identity,messageId:'msg_dify_sample',answer})
  assert.equal(result.status,200)
  assert.equal(result.coordinatorNotified,true)
  const saved = JSON.parse(await readFile(fixturePath,'utf8'))
  assert.equal(saved.messages.at(-1).thread_id,'msg_dify_sample')
  assert.equal(saved.messages.at(-1).body,answer)
  const after = await call(stateUrl)
  assert.equal(after.state.questions.length,0)
})

test('评审后返修 Worker 正在执行时，旧评审和 MR 备注不覆盖当前开发阶段', async () => {
  const data = fixture()
  data.tasks.push({id:'repair',task_title:'开发返修',status:'dispatched'})
  data.workers.unshift({taskId:'repair',runId,dispatchId:'ctx_repair',agentTerminalHandle:'term_repair',dispatchStatus:'dispatched',resource:{worktreeId},projection:{outcome:'in_progress',workspace:{id:worktreeId},provider:{id:'grok',model:'grok-4.7'}}})
  const result = await state(data)
  assert.equal(result.state.stage,'implementation')
  assert.equal(result.state.flowStatus,'active')
})

test('历史结束决定不能覆盖新排队任务或已完成的新一轮开发', async () => {
  const data = fixture()
  data.tasks.push({id:'repair',task_title:'开发返修',status:'ready'})
  let result = await state(data)
  assert.equal(result.state.flowStatus,'active')
  data.tasks.at(-1).status = 'completed'
  data.workers.unshift({taskId:'repair',runId,dispatchId:'ctx_repair',dispatchStatus:'completed',projection:{outcome:'succeeded'}})
  result = await state(data)
  assert.equal(result.state.stage,'implementation')
  assert.equal(result.state.flowStatus,'active')
  assert.equal(result.state.mrReview.current,false)
})

test('历史决策入口 Task 仍为 ready 时，已解决 Gate 不会重新阻塞已结束流程', async () => {
  const data = fixture()
  data.tasks.push({id:'old-decision',task_title:'Harness Review 决策入口',status:'ready'})
  data.gates.push({id:'gate_old',run_id:runId,task_id:'old-decision',status:'resolved',resolution:'此前已继续'})
  const result = await state(data)
  assert.equal(result.state.flowStatus,'completed')
})

test('释放 QA 和开发终端后，从持久 launch.effective 恢复模型，不误改交叉验证结论', async () => {
  const data = fixture()
  data.tasks.find(task => task.id === 'qa').status = 'completed'
  data.tasks.find(task => task.id === 'qa').result = JSON.stringify({outcome:'succeeded',body:'聚焦验证完成',testCases:[{id:'TC-01',status:'passed',evidence:'Service/Mapper 前后值已比对'}]})
  for (const id of ['qa','implementation']) {
    const worker = data.workers.find(worker => worker.taskId === id)
    const provider = worker.projection.provider
    data.launches[worker.dispatchId] = {agent:provider.id,model:provider.model,effort:id === 'qa' ? 'high':'medium'}
    worker.projection.provider = null
  }
  const result = await state(data)
  assert.equal(result.state.qa.crossValidated,true)
  assert.equal(result.state.qa.model,'gpt-6-luna')
  assert.equal(result.state.qa.implementationModel,'grok-4.7')
})

test('Command Code 开发由 Codex QA 交叉验证，历史 Grok 配对仍可回读', async () => {
  const data = fixture()
  data.tasks.find(task => task.id === 'qa').status = 'completed'
  data.tasks.find(task => task.id === 'qa').result = JSON.stringify({outcome:'succeeded',body:'聚焦验证完成',testCases:[{id:'TC-01',status:'passed',evidence:'已核对'}]})
  const implementation = data.workers.find(worker => worker.taskId === 'implementation')
  implementation.projection.provider = {id:'cmd',model:'command-code-default',effort:''}
  let result = await state(data)
  assert.equal(result.state.qa.crossValidated,true)
  assert.equal(result.state.qa.modelMismatch,false)
  implementation.projection.provider = {id:'grok',model:'grok-4.7',effort:'medium'}
  result = await state(data)
  assert.equal(result.state.qa.crossValidated,true)
})

test('思考强度动态调整或未知时如实展示，不否定业务验证', async () => {
  const data = fixture()
  const qa = data.tasks.find(task => task.id === 'qa')
  qa.status = 'completed'
  qa.spec = '聚焦验收\nplanned_effort=medium'
  qa.result = JSON.stringify({outcome:'succeeded',testCases:[{id:'TC-01',status:'passed',evidence:'真实前后值一致'}]})
  data.tasks.find(task => task.id === 'implementation').spec = '本轮开发\nplanned_effort=medium'
  const qaProvider = data.workers.find(worker => worker.taskId === 'qa').projection.provider
  qaProvider.effort = 'medium'
  let result = await state(data)
  assert.equal(result.state.qa.crossValidated,true)
  assert.equal(result.state.qa.unverified,false)
  assert.equal(result.state.qa.effort,'medium')
  assert.equal(result.state.qa.plannedEffort,'medium')
  qaProvider.effort = 'high'
  result = await state(data)
  assert.equal(result.state.qa.effortMismatch,true)
  assert.equal(result.state.qa.crossValidated,true)
  assert.equal(result.state.qa.unverified,false)
  qaProvider.effort = ''
  result = await state(data)
  assert.equal(result.state.qa.effort,'')
  assert.equal(result.state.qa.effortMismatch,false)
  assert.equal(result.state.qa.unverified,false)
})

test('Command Code 不支持或未暴露强度时记录未知，不假称 medium', async () => {
  const data=fixture()
  const qa=data.tasks.find(task=>task.id==='qa')
  qa.status='completed'
  qa.spec='planned_effort=medium'
  qa.result=JSON.stringify({outcome:'succeeded',testCases:[{id:'TC-01',status:'passed',evidence:'已核对前后值'}]})
  data.workers.find(worker=>worker.taskId==='qa').projection.provider.effort='medium'
  data.tasks.find(task=>task.id==='implementation').spec='planned_effort=unknown'
  data.workers.find(worker=>worker.taskId==='implementation').projection.provider={id:'command-code',model:'deepseek-v4.1',effort:''}
  let result=await state(data)
  assert.equal(result.state.qa.implementationEffort,'')
  assert.equal(result.state.qa.implementationPlannedEffort,'')
  assert.equal(result.state.qa.crossValidated,true)
  assert.equal(result.state.qa.unverified,false)
  data.tasks.find(task=>task.id==='implementation').spec='planned_effort=medium'
  result=await state(data)
  assert.equal(result.state.qa.implementationEffort,'')
  assert.equal(result.state.qa.implementationPlannedEffort,'medium')
  assert.equal(result.state.qa.effortMismatch,false)
  assert.equal(result.state.qa.unverified,false)
})

test('Worker 成功和单测通过不能替代业务用例未运行；模型不符也不得通过 QA', async () => {
  const data = fixture()
  data.tasks.find(task => task.id === 'qa').status = 'completed'
  data.tasks.find(task => task.id === 'qa').result = JSON.stringify({outcome:'succeeded',body:'mock 22/22',testCases:[{id:'TC-01',status:'not_run'}]})
  let result = await state(data)
  assert.equal(result.state.qa.unverified,true)
  assert.equal(result.state.qa.crossValidated,false)
  assert.equal(result.state.reviewReady,false)
  data.tasks.find(task => task.id === 'qa').result = JSON.stringify({outcome:'succeeded',testCases:[{id:'TC-01',status:'passed',evidence:'已核对'}]})
  data.workers.find(worker => worker.taskId === 'implementation').projection.provider.model = 'grok-4.6'
  result = await state(data)
  assert.equal(result.state.qa.crossValidated,false)
  assert.equal(result.state.qa.modelMismatch,true)
})

test('范围外验收用例可标记本轮不适用，但至少一个范围内用例须有通过证据', async () => {
  const data = fixture()
  data.tasks.find(task => task.id === 'analysis').result = JSON.stringify({outcome:'succeeded',reportPath,
    testCases:[
      {id:'TC-01',title:'填充已有图片数据',expected:'只更新图片字段'},
      {id:'TC-02',title:'实际图片上传识别',expected:'触发识别'},
      {id:'TC-03',title:'调用外部服务生成结果',expected:'返回生成结果'}
    ]})
  data.tasks.find(task => task.id === 'qa').status = 'completed'
  data.tasks.find(task => task.id === 'qa').result = JSON.stringify({outcome:'succeeded',excludedTestCaseIds:['TC-03'],testCases:[
    {id:'TC-01',status:'passed',evidence:'真实 Service/Mapper 写入并核对改前改后值'},
    {id:'TC-02',status:'not_applicable',evidence:'本轮 diff 仅填充已有图片数据，未修改上传或识别行为'}
  ]})
  let result = await state(data)
  assert.equal(result.state.qa.unverified,false)
  assert.equal(result.state.qa.crossValidated,true)
  assert.deepEqual(result.state.qa.excludedTestCaseIds,['TC-03'])
  assert.equal(result.state.reviewReady,true)

  data.tasks.find(task => task.id === 'qa').result = JSON.stringify({outcome:'succeeded',testCases:[
    {id:'TC-01',status:'not_applicable',evidence:'本轮 diff 不涉及'},
    {id:'TC-02',status:'not_applicable',evidence:'本轮 diff 不涉及'}
  ]})
  result = await state(data)
  assert.equal(result.state.qa.crossValidated,false)
  assert.equal(result.state.reviewReady,false)
})

test('Gate 读取失败显示错误，不能声称没有待确认问题；其他 Run 的 Gate 不可答复', async () => {
  const data = fixture()
  data.fail = 'orchestration gate-list'
  let result = await state(data)
  assert.equal(result.status,502)
  assert.match(result.error,/fixture failure/)
  delete data.fail
  data.gates = [{id:'gate_foreign',run_id:'run_bbbbbbbbbbbb',status:'pending',question:'其他工单'}]
  result = await state(data)
  assert.equal(result.state.questions.length,0)
  result = await call('/auto-dev-flow/orca/answer',{...identity,messageId:'gate_foreign',answer:'同意'})
  assert.equal(result.status,502)
})

test('同一 QA Task 的旧 Dispatch 迟到回传不能覆盖当前 Dispatch 的用例结果', async () => {
  const data = fixture()
  const qa = data.tasks.find(task => task.id === 'qa')
  qa.status = 'dispatched'
  qa.result = ''
  const worker = data.workers.find(item => item.taskId === 'qa')
  worker.dispatchId = 'ctx_current'
  worker.dispatchStatus = 'dispatched'
  worker.projection.outcome = 'in_progress'
  data.messages.push({id:'late-old-qa',run_id:runId,type:'worker_done',payload:{
    taskId:'qa',dispatchId:'ctx_old',outcome:'succeeded',
    testCases:[{id:'TC-01',status:'passed',evidence:'旧一轮结果'}]
  }})
  const result = await state(data)
  assert.deepEqual(result.state.qa.testCases,[])
  assert.equal(result.state.qa.unverified,true)
})

test('明确开始新一轮返修和 QA 后，旧的跳过标记不吞掉新一轮验证结果', async () => {
  const data = fixture()
  data.worktree.comment = 'PingCode JGA-1269 · 当前阶段：待提交 Review · 独立验证：用户跳过，未验证'
  data.tasks.push({id:'repair-2',task_title:'返修：JGA-1269',status:'completed',result:''})
  data.workers.unshift({taskId:'repair-2',runId,dispatchId:'ctx_repair_2',agentTerminalHandle:'term_repair_2',
    dispatchStatus:'completed',resource:{worktreeId},projection:{outcome:'succeeded',workspace:{id:worktreeId},
      provider:{id:'grok',model:'grok-4.7',effort:'medium'}}})
  data.tasks.push({id:'qa-2',task_title:'独立 QA：返修定向验证',status:'completed',result:JSON.stringify({
    outcome:'succeeded',testCases:[{id:'TC-01',status:'passed',evidence:'新返修后的聚焦验证'}]
  })})
  data.workers.unshift({taskId:'qa-2',runId,dispatchId:'ctx_qa_2',agentTerminalHandle:'term_qa_2',
    dispatchStatus:'completed',resource:{worktreeId},projection:{outcome:'succeeded',workspace:{id:worktreeId},
      provider:{id:'codex',model:'gpt-6-luna',effort:'high'}}})
  const result = await state(data)
  assert.equal(result.state.qa.taskId,'qa-2')
  assert.equal(result.state.qa.skipped,false)
  assert.equal(result.state.qa.crossValidated,true)
  assert.equal(result.state.qa.unverified,false)
})

test('实现已更新时保留旧 QA 结果供查看，但不能开放本轮 Review', async () => {
  for (const scope of ['', ` · QA跳过范围：${runId}/implementation`]) {
    const data=fixture()
    data.worktree={comment:'PingCode JGA-1269 · 当前阶段：待提交 Review · 独立验证：用户跳过，未验证'+scope}
    const qa=data.tasks.find(task=>task.id==='qa')
    qa.status='completed'
    qa.result=JSON.stringify({outcome:'succeeded',testCases:[{id:'TC-01',status:'passed',evidence:'旧代码的测试'}]})
    data.gates.push({id:'old-stop',run_id:runId,task_id:'qa',status:'resolved',question:'停止 QA？',resolution:'停止'})
    data.tasks.push({id:'repair-new',task_title:'开发返修',status:'completed'})
    data.workers.unshift({taskId:'repair-new',runId,dispatchId:'ctx_repair_new',dispatchStatus:'completed',resource:{worktreeId},
      projection:{outcome:'succeeded',provider:{id:'grok',model:'grok-4.7',effort:'medium'},workspace:{id:worktreeId}}})
    let result=await state(data)
    assert.equal(result.state.qaSkipped,false)
    assert.equal(result.state.qa.crossValidated,false)
    assert.equal(result.state.qa.unverified,true)
    assert.equal(result.state.qa.current,false)
    assert.deepEqual(result.state.qa.testCases,[{id:'TC-01',status:'passed',evidence:'旧代码的测试'}])
    assert.equal(result.state.reviewReady,false)
    assert.equal(result.state.stage,'implementation')
    data.tasks.push({id:'qa-new',task_title:'独立 QA',status:'failed',result:JSON.stringify({
      outcome:'failed',testCases:[{id:'TC-01',status:'failed',evidence:'新代码测试失败'}]})})
    data.workers.unshift({taskId:'qa-new',runId,dispatchId:'ctx_qa_new',dispatchStatus:'failed',resource:{worktreeId},
      projection:{outcome:'failed',provider:{id:'codex',model:'gpt-6-luna',effort:'high'},workspace:{id:worktreeId}}})
    result=await state(data)
    assert.equal(result.state.qaSkipped,false)
    assert.equal(result.state.reviewReady,false)
    assert.equal(result.state.stage,'tests')
  }
})

test('同一实现轮次的跳过决定不能因额外启动 QA 被抹掉', async () => {
  const data=fixture()
  data.worktree={comment:`PingCode JGA-1269 · 当前阶段：待提交 Review · 独立验证：用户跳过，未验证 · QA跳过范围：${runId}/implementation`}
  data.tasks.push({id:'unexpected-qa',task_title:'独立 QA',status:'dispatched'})
  data.workers.unshift({taskId:'unexpected-qa',runId,dispatchId:'ctx_unexpected',dispatchStatus:'dispatched',resource:{worktreeId},
    projection:{outcome:'in_progress',provider:{id:'codex',model:'gpt-6-luna',effort:'high'},workspace:{id:worktreeId}}})
  const result=await state(data)
  assert.equal(result.state.qaSkipped,true)
  assert.equal(result.state.qa.unverified,true)
  assert.equal(result.state.qa.crossValidated,false)
  assert.equal(result.state.reviewReady,false)
})

test('重派当前 QA 时残留的旧 Dispatch 持久结果不能成为本轮证据', async () => {
  const data=fixture()
  const qa=data.tasks.find(task=>task.id==='qa')
  qa.result=JSON.stringify({dispatchId:'ctx_old',testCases:[{id:'TC-01',status:'passed',evidence:'旧结果'}]})
  const worker=data.workers.find(worker=>worker.taskId==='qa')
  worker.dispatchId='ctx_new'
  const result=await state(data)
  assert.deepEqual(result.state.qa.testCases,[])
  assert.equal(result.state.qa.unverified,true)
})

test('失败的新实现尝试保留上一版 QA 与调用说明，但不能开放 Review', async () => {
  const data=fixture()
  const qa=data.tasks.find(task=>task.id==='qa')
  qa.status='completed'
  qa.result=JSON.stringify({outcome:'succeeded',testCases:[{id:'TC-01',status:'passed',evidence:'上一版实现'}],
    dependencyNotes:[{caller:'oldCaller',callee:'oldService',purpose:'上一版',verification:'passed',impact:'旧风险'}]})
  data.workers.find(worker=>worker.taskId==='qa').projection.outcome='succeeded'
  data.tasks.push({id:'repair-failed',task_title:'开发返修',status:'failed',result:JSON.stringify({dependencyNotes:[
    {caller:'newCaller',callee:'newService',purpose:'当前失败尝试',verification:'not_run',impact:'未验证'}]})})
  data.workers.unshift({taskId:'repair-failed',runId,dispatchId:'ctx_repair_failed',dispatchStatus:'failed',resource:{worktreeId},
    projection:{outcome:'failed',provider:{id:'grok',model:'grok-4.7',effort:'medium'},workspace:{id:worktreeId}}})
  const result=await state(data)
  assert.equal(result.state.reviewReady,false,JSON.stringify({qa:result.state.qa,dependencyNotes:result.state.dependencyNotes,stage:result.state.stage}))
  assert.equal(result.state.qa.crossValidated,false)
  assert.equal(result.state.qa.unverified,true)
  assert.equal(result.state.qa.current,false)
  assert.deepEqual(result.state.qa.testCases,[{id:'TC-01',status:'passed',evidence:'上一版实现'}])
  assert.ok(result.state.dependencyNotes?.some(note=>note.caller==='newCaller'))
  assert.ok(result.state.dependencyNotes?.some(note=>note.caller==='oldCaller'))
})
