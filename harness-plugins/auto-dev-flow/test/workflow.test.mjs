import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'harness-flow-'))
const fixturePath = join(directory, 'state.json')
const command = join(directory, 'orca')
await writeFile(command, `#!${process.execPath}
const fs = require('node:fs')
const file = process.env.HARNESS_FLOW_FIXTURE
const state = JSON.parse(fs.readFileSync(file, 'utf8'))
const args = process.argv.slice(2)
const value = key => args[args.indexOf(key) + 1]
const operation = args.slice(0, 2).join(' ')
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
  case 'terminal send': result = {send:{accepted:true,stage:'turn_started'}}; break
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
const { apply } = await import(process.env.HARNESS_FLOW_MODULE || '../index.js')
const handlers = new Map()
apply({ inject(_names, callback) {
  callback({ effect(callback) { callback() }, webServer: { register(route) {
    handlers.set(route.path, route.handler)
    return () => {}
  } } })
} })
after(() => rm(directory, { recursive: true, force: true }))

const runId = 'run_aaaaaaaaaaaa'
const worktreeId = 'repo-test::/tmp/insuranceagent-worktree'
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
    tasks:[task('analysis','需求分析', 'completed', JSON.stringify({outcome:'succeeded',reportPath:'/tmp/JGA-1269.html',testCases:[{id:'TC-01',title:'上传生成报告'}]})),
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
  await handlers.get(path.split('?')[0])(request, {writeHead(code){status=code},end(value){payload=JSON.parse(value)}})
  return {status,...payload}
}
const identity = {bugId:'JGA-1269',repoId:'repo-test',worktree:'/tmp/insuranceagent-worktree',runId,coordinatorTerminal:'term_coordinator'}
const stateUrl = '/auto-dev-flow/orca/state?' + new URLSearchParams(identity)
async function state(data) {
  await writeFile(fixturePath, JSON.stringify(data))
  return call(stateUrl)
}

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

test('QA 缺 Dify 返回样例时可在 Harness 提问，粘贴 JSON 后原样持久回复同一线程', async () => {
  const data = fixture()
  data.tasks.push({id:'qa-sample',task_title:'独立 QA 返回契约样例',status:'blocked'})
  data.messages.push({id:'msg_dify_sample',run_id:runId,type:'question',thread_id:'msg_dify_sample',
    body:'请粘贴 Dify 成功返回的脱敏 JSON，需包含 outputs；MQ/Dify 服务按约定默认正常。',
    payload:{taskId:'qa-sample'}})
  const before = await state(data)
  assert.equal(before.state.flowStatus,'waiting')
  assert.equal(before.state.questions[0].id,'msg_dify_sample')
  const sample = '{\n  "data": {"outputs": {"comment": "样例评述", "success": true}}\n}'
  const result = await call('/auto-dev-flow/orca/answer',{...identity,messageId:'msg_dify_sample',answer:sample})
  assert.equal(result.status,200)
  assert.equal(result.coordinatorNotified,true)
  const saved = JSON.parse(await readFile(fixturePath,'utf8'))
  assert.equal(saved.messages.at(-1).thread_id,'msg_dify_sample')
  assert.equal(saved.messages.at(-1).body,sample)
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
