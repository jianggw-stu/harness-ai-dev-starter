import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')

function dashboard(runtime, overrides = {}) {
  const item = {id:'flow-1',bugId:'JGA-1269',title:'补图报告',repository:'insuranceagent',repoId:'repo-test',
    worktree:'/tmp/insuranceagent-worktree',stage:'mrReviewed',status:runtime?.flowStatus,requirementsConfirmedAt:'2026-10-23T04:00:00Z',notes:[],...overrides}
  const state = []
  state[18] = item.id
  state[27] = runtime
  let index = 0
  let refIndex = 0
  const refs = []
  let renderer
  let sent
  let effects = []
  const React = {
    Fragment:'fragment',
    createElement(type, props, ...children) { return {type,props:props || {},children} },
    useState(initial) {
      const position = index++
      if (state[position] === undefined) state[position] = typeof initial === 'function' ? initial() : initial
      return [state[position],next => {state[position] = typeof next === 'function' ? next(state[position]) : next}]
    },
    useRef(value) { const position = refIndex++; return refs[position] ||= {current:value} },
    useEffect(callback, dependencies) {effects.push({callback,dependencies})}
  }
  const ctx = {get(){},effect(){},slots:{inject(_name,fn){fn()},register(options,fn){if(options.name === 'main') renderer=fn}}}
  vm.runInNewContext(source, {
    URL,URLSearchParams,console,
    window:{localStorage:{getItem(){return JSON.stringify([item])}},__ModuleLoader__:{load({factory}){factory(() => React).apply(ctx)}}},
    fetch:async (url,options) => {
      sent = {url,body:JSON.parse(options.body)}
      return {ok:true,json:async()=>({ok:true,coordinatorNotified:true})}
    }
  })
  function render() {
    index = 0
    refIndex = 0
    effects = []
    const root = renderer({})
    return root.type(root.props)
  }
  const walk = (tree,predicate) => {
    if (Array.isArray(tree)) return tree.flatMap(item => walk(item,predicate))
    if (!tree || typeof tree !== 'object') return []
    return [...(predicate(tree) ? [tree] : []),...tree.children.flatMap(child => walk(child,predicate))]
  }
  const texts = tree => {
    if (Array.isArray(tree)) return tree.map(texts).join(' ')
    if (!tree || typeof tree === 'boolean') return ''
    return typeof tree === 'object' ? tree.children.map(texts).join(' ') : String(tree)
  }
  function open(tab) {
    const tree = render()
    const button = walk(tree, node => node.type === 'button' && node.props.key === tab)[0]
    assert.ok(button, `missing tab ${tab}`)
    button.props.onClick()
    return render()
  }
  return {render,open,walk,texts,state,get effects(){return effects},get sent(){return sent}}
}

test('Harness 显示 Gate 原题和快捷选项，选择后提交精确 Gate ID', async () => {
  const view = dashboard({runId:'run_aaaaaaaaaaaa',flowStatus:'waiting',stage:'mrReviewed',
    questions:[{id:'gate_1',kind:'gate',question:'评审已完成，如何处理风险？',options:['记录风险并结束（推荐）','返修']}],
    mrReview:{completed:true,draft:true,noteUrl:'https://git.example.test/mr/1#note_1'}})
  let tree = view.open('questions')
  assert.match(view.texts(tree),/评审已完成，如何处理风险/)
  const option = view.walk(tree,node => node.type === 'button' && view.texts(node) === '记录风险并结束（推荐）')[0]
  assert.ok(option)
  option.props.onClick()
  tree = view.render()
  const submit = view.walk(tree,node => node.type === 'button' && view.texts(node) === '提交答复')[0]
  assert.equal(submit.props.disabled,false)
  await submit.props.onClick()
  assert.equal(view.sent.url,'/auto-dev-flow/orca/answer')
  assert.equal(view.sent.body.messageId,'gate_1')
  assert.equal(view.sent.body.answer,'记录风险并结束（推荐）')
})

test('Harness 的 Orca ask 快捷选项直接显示唯一推荐项', () => {
  const view=dashboard({runId:'run_aaaaaaaaaaaa',flowStatus:'waiting',stage:'requirements',
    questions:[{id:'msg_1',kind:'question',question:'运营手动上传图片后，单项 AI 报告何时触发？',
      options:['上传成功后自动生成（推荐）','人员手动点击生成','按现有业务规则']} ]},
    {stage:'requirements',requirementsConfirmedAt:''})
  const tree=view.open('questions')
  assert.match(view.texts(tree),/上传成功后自动生成（推荐）/)
  assert.equal(view.walk(tree,node=>node.type==='button'&&view.texts(node)==='上传成功后自动生成（推荐）').length,1)
})

test('评审完成和本轮结束同时显示；Draft、未验证仍单独保留', () => {
  const view = dashboard({runId:'run_aaaaaaaaaaaa',flowStatus:'completed',stage:'mrReviewed',reviewSubmitted:true,questions:[],
    mrReview:{completed:true,draft:true,noteUrl:'https://git.example.test/mr/1#note_1'},
    mrReviewNote:'远程评审已完成 · MR 保持 Draft',qa:{status:'completed',unverified:true}})
  const text = view.texts(view.open('review'))
  assert.match(text,/本轮已结束/)
  assert.match(text,/评审完成/)
  assert.match(text,/MR 保持 Draft/)
  assert.match(view.texts(view.open('qa')),/独立验证结果 · 未验证/)
  assert.match(text,/查看完整评审意见/)
})

test('需求结论展示内嵌评审页，摘要不重复路径和原始用例；报告错误时禁用确认', () => {
  const review={body:'已生成页面，reportPath: .harness-dist/JGA-1269/需求结论.html；testCases: [{id:TC-01,title:上传图片}]；请确认。',
    reportPath:'.harness-dist/JGA-1269/需求结论.html',reportError:'',testCases:[{id:'TC-01',title:'上传图片',expected:'生成报告'}]}
  const view=dashboard({runId:'run_aaaaaaaaaaaa',stage:'requirements',questions:[],review},
    {stage:'requirements',requirementsConfirmedAt:''})
  const tree=view.open('requirements')
  assert.equal(view.walk(tree,node=>node.type==='iframe').length,1)
  assert.doesNotMatch(view.texts(tree),/reportPath:|testCases:|\.harness-dist/)
  const confirm=view.walk(tree,node=>node.type==='button'&&view.texts(node)==='确认需求并继续')[0]
  assert.equal(confirm.props.disabled,false)
  const broken=dashboard({runId:'run_aaaaaaaaaaaa',stage:'requirements',questions:[],
    review:{...review,reportPath:'',reportError:'需求评审页文件不存在'}},
    {stage:'requirements',requirementsConfirmedAt:''})
  const brokenTree=broken.open('requirements')
  assert.match(broken.texts(brokenTree),/需求评审页文件不存在/)
  assert.equal(broken.walk(brokenTree,node=>node.type==='button'&&broken.texts(node)==='确认需求并继续')[0].props.disabled,true)
})

test('用户跳过 QA 后显示已跳过且保留未验证，Review 按钮可点击', () => {
  const view=dashboard({runId:'run_aaaaaaaaaaaa',stage:'mrPreparation',questions:[],reviewReady:true,
    qaSkipped:true,reviewSubmitted:false,qa:{status:'failed',skipped:true,unverified:true,testCases:[]},
    review:{testCases:[{id:'TC-01',title:'上传生成报告'}]}})
  const tree=view.open('qa')
  assert.match(view.texts(tree),/独立验证结果 · 已跳过/)
  assert.match(view.texts(tree),/未验证/)
  assert.doesNotMatch(view.texts(tree),/未开始|等待开发与独立验证完成/)
  assert.equal(view.walk(view.open('review'),node=>node.type==='button'&&view.texts(node)==='提交 Review')[0].props.disabled,false)
})

test('新修复尚未验证时仍显示上一轮 QA 和既有调用说明，并标记结果已过期', () => {
  const view=dashboard({stage:'implementation',questions:[],qa:{status:'failed',current:false,unverified:true,
    testCases:[{id:'TC-01',status:'failed',evidence:'上一轮断言失败'},
      {id:'TC-04',status:'partial',evidence:'只核对持久化，未核对完整合并输入'}]},
    review:{testCases:[{id:'TC-01',title:'上传图片'},{id:'TC-04',title:'综合结果覆盖全部单项'}]},
    dependencyNotes:[{caller:'saveForm',callee:'existingMapper.update',purpose:'追加图片',
      verification:'上一轮 QA 覆盖',impact:'当前修复未验证'}]})
  const tree=view.open('qa')
  assert.match(view.texts(tree),/上一轮未通过（当前修复未验证）/)
  assert.match(view.texts(tree),/TC-01/)
  assert.match(view.texts(tree),/失败/)
  assert.match(view.texts(tree),/上传图片/)
  assert.match(view.texts(tree),/上一轮断言失败/)
  assert.match(view.texts(tree),/TC-04/)
  assert.match(view.texts(tree),/部分验证/)
  const qaDetails = view.walk(tree,node => node.type === 'details' && node.props.className === 'adf__qa-evidence')
  assert.equal(qaDetails.length,2)
  assert.equal(qaDetails[0].props.open,true)
  assert.equal(qaDetails[1].props.open,false)
  assert.match(view.texts(tree),/以下用例和结果属于上一轮开发/)
  const implementationTree=view.open('implementation')
  assert.match(view.texts(implementationTree),/调用说明来自上一轮 QA/)
  assert.match(view.texts(implementationTree),/saveForm → existingMapper.update/)
})

test('范围外用例显示为本轮不适用，不计入未完成项', () => {
  const view=dashboard({stage:'tests',questions:[],qa:{status:'completed',current:true,unverified:false,crossValidated:true,
    testCases:[
      {id:'TC-01',status:'passed',evidence:'本轮改动对应的 Service/Mapper 行为已核对'},
      {id:'TC-02',status:'not_applicable',evidence:'本轮改动未涉及图片上传或识别'}
    ]},review:{testCases:[
      {id:'TC-01',title:'填充已有图片数据',expected:'目标字段持久化正确'},
      {id:'TC-02',title:'实际图片上传识别',expected:'触发识别'},
      {id:'TC-03',title:'Dify 返回报告',expected:'Dify 返回成功'}
    ]}})
  const tree=view.open('qa')
  const text=view.texts(tree)
  assert.match(text,/本轮不适用/)
  assert.doesNotMatch(text,/1 未完成/)
  assert.doesNotMatch(text,/Dify/)
  assert.match(text,/本轮改动未涉及图片上传或识别/)

  const beforeQa=dashboard({stage:'tests',questions:[],review:{testCases:[
    {id:'TC-03',title:'调用外部服务生成结果',expected:'返回生成结果'}
  ]}})
  const beforeQaText=beforeQa.texts(beforeQa.open('qa'))
  assert.doesNotMatch(beforeQaText,/调用外部服务生成结果/)
  assert.match(beforeQaText,/等待本轮聚焦测试结果/)
})

test('状态尚未返回时显示同步中，不推断需求 Worker 缺失或开发未完成', () => {
  const view=dashboard(null,{stage:'mrPreparation',status:'active'})
  const text=view.texts(view.open('requirements'))
  assert.match(text,/正在同步 Orca 状态/)
  assert.doesNotMatch(text,/等待 Orca 创建需求分析 Worker|等待开发与独立验证完成/)
})

test('既有调用按折叠项展示覆盖与未验证影响，明确区分缺失说明和空清单', () => {
  const runtime = {stage:'mrPreparation',questions:[],reviewReady:true,dependencyNotes:[{
    caller:'saveForm',callee:'existingMapper.update',purpose:'填充本次字段',verification:'Mock 返回值，未真实调用',impact:'并发行为留待集成验收'
  }]}
  const view = dashboard(runtime)
  const tree = view.open('implementation')
  const details = view.walk(tree,node => node.type === 'details' && view.texts(node).includes('填充本次字段'))[0]
  assert.ok(details)
  assert.ok(!details.props.open)
  assert.match(view.texts(details),/saveForm → existingMapper.update/)
  assert.match(view.texts(details),/Mock 返回值，未真实调用/)
  assert.match(view.texts(details),/并发行为留待集成验收/)
  assert.equal(details.props.open,undefined)
  assert.equal(view.walk(view.open('review'),node=>node.type==='button'&&view.texts(node)==='提交 Review')[0].props.disabled,false)
  const missing = dashboard({...runtime,dependencyNotes:null})
  assert.match(missing.texts(missing.open('implementation')),/尚未回传既有调用说明/)
  const empty = dashboard({...runtime,dependencyNotes:[]})
  assert.match(empty.texts(empty.open('implementation')),/本轮未报告本次改动依赖的既有调用/)
})

test('同一轮渲染触发阶段和问题更新时，合并最新记录而不互相覆盖', () => {
  const runtime = {runId:'run_aaaaaaaaaaaa',flowStatus:'waiting',stage:'mrReviewed',
    questions:[{id:'gate_1',question:'选择后续处理'}],reviewSubmitted:true,mrReview:{completed:true,draft:true}}
  const view = dashboard(runtime,{stage:'mrReview',status:'active'})
  view.render()
  const syncStage = view.effects.find(effect => effect.dependencies?.includes(runtime.flowStatus))
  const syncQuestions = view.effects.find(effect => effect.dependencies?.includes(runtime.questions))
  assert.ok(syncStage)
  assert.ok(syncQuestions)
  syncStage.callback()
  syncQuestions.callback()
  assert.equal(view.state[0][0].stage,'mrReviewed')
  assert.equal(view.state[0][0].status,'waiting')
  assert.equal(view.state[0][0].pendingOrcaQuestions[0].id,'gate_1')
})

test('只有等待状态变化时不重复记录相同的阶段变更', () => {
  const runtime={runId:'run_aaaaaaaaaaaa',flowStatus:'waiting',stage:'requirements',questions:[]}
  const view=dashboard(runtime,{stage:'requirements',status:'active',requirementsConfirmedAt:''})
  view.render()
  const sync=view.effects.find(effect=>effect.dependencies?.includes(runtime.flowStatus))
  sync.callback()
  assert.equal(view.state[0][0].status,'waiting')
  assert.equal(view.state[0][0].notes.length,0)
})

test('分类展示真实结果，阶段变化自动切换，同阶段刷新保留手动选择', () => {
  const runtime = {runId:'run_aaaaaaaaaaaa',stage:'tests',questions:[],
    implementation:{status:'completed',succeeded:true},qa:{status:'failed',skipped:true,unverified:true,testCases:[]}}
  const view = dashboard(runtime,{stage:'implementation'})
  let tree = view.render()
  const tab = id => view.walk(tree,node=>node.type==='button' && node.props.key===id)[0]
  assert.match(view.texts(tab('requirements')),/已确认/)
  assert.match(view.texts(tab('implementation')),/已完成/)
  assert.match(view.texts(tab('qa')),/已跳过（未验证）/)
  let auto = view.effects.find(effect=>effect.dependencies?.length===5 && effect.dependencies.includes(runtime.runId) && effect.dependencies.includes('tests'))
  assert.ok(auto)
  auto.callback()
  tree=view.render()
  assert.equal(tab('qa').props['aria-current'],'page')
  tree=view.open('requirements')
  auto=view.effects.find(effect=>effect.dependencies?.length===5 && effect.dependencies.includes('tests'))
  auto.callback()
  tree=view.render()
  assert.equal(tab('requirements').props['aria-current'],'page')
  view.state[27]={...runtime,stage:'mrReviewed',mrReview:{completed:true,current:true,noteUrl:'https://git.example.test/mr/1#note'}}
  tree=view.render()
  auto=view.effects.find(effect=>effect.dependencies?.length===5 && effect.dependencies.includes('mrReviewed'))
  auto.callback()
  tree=view.render()
  assert.equal(tab('review').props['aria-current'],'page')
  assert.match(view.texts(tab('review')),/评审完成/)
  assert.match(view.texts(tab('qa')),/已跳过（未验证）/)
  const qaPhase=view.walk(tree,node=>node.props.key==='phase-2')[0]
  assert.match(view.texts(qaPhase),/独立验证 · 已跳过/)
  assert.match(qaPhase.props.className,/adf__phase--attention/)
  assert.doesNotMatch(view.texts(qaPhase),/✓/)
  const stageSelect=view.walk(tree,node=>node.type==='select' && node.props.className==='adf__select' && node.props.value==='mrReviewed')[0]
  assert.ok(stageSelect)
})

test('评审阶段只对本轮有通过证据的独立验证显示完成', () => {
  const verified=dashboard({stage:'mrReviewed',questions:[],qa:{status:'completed',current:true,unverified:false,crossValidated:true}})
  const passed=verified.walk(verified.render(),node=>node.props.key==='phase-2')[0]
  assert.match(verified.texts(passed),/✓/)
  assert.match(passed.props.className,/adf__phase--complete/)
  const pending=dashboard({stage:'mrReviewed',questions:[],qa:{status:'completed',unverified:true,crossValidated:false}})
  const unverified=pending.walk(pending.render(),node=>node.props.key==='phase-2')[0]
  assert.match(pending.texts(unverified),/独立验证 · 未验证/)
  assert.doesNotMatch(pending.texts(unverified),/✓/)
})

test('时间线展示任务创建至完成的耗时，并说明包含等待', () => {
  const view=dashboard({stage:'mrReviewed',questions:[],taskTimings:[{id:'t1',title:'需求分析',
    startedAt:'2026-10-27T01:49:48.000Z',finishedAt:'2026-10-27T01:55:37.000Z',durationMs:349000,gapMs:90000}]})
  const tree=view.open('timeline')
  assert.match(view.texts(tree),/编排任务耗时 · 1/)
  assert.match(view.texts(tree),/需求分析\s*·\s*5分49秒/)
  assert.match(view.texts(tree),/包含等待/)
  assert.match(view.texts(tree),/距上一任务完成 1分30秒/)
  assert.match(view.texts(tree),/模型和节点耗时未单独计量/)
})
