import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')

function dashboard(runtime, overrides = {}) {
  const item = {id:'flow-1',bugId:'JGA-1269',title:'补图报告',repository:'insuranceagent',repoId:'repo-test',
    worktree:'/tmp/insuranceagent-worktree',stage:'mrReviewed',status:runtime.flowStatus,requirementsConfirmedAt:'2026-10-23T04:00:00Z',notes:[],...overrides}
  const state = []
  state[18] = item.id
  state[26] = runtime
  let index = 0
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
    useRef(value) { return {current:value} },
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
  return {render,walk,texts,state,get effects(){return effects},get sent(){return sent}}
}

test('Harness 显示 Gate 原题和快捷选项，选择后提交精确 Gate ID', async () => {
  const view = dashboard({runId:'run_aaaaaaaaaaaa',flowStatus:'waiting',stage:'mrReviewed',
    questions:[{id:'gate_1',kind:'gate',question:'评审已完成，如何处理风险？',options:['记录风险并结束（推荐）','返修']}],
    mrReview:{completed:true,draft:true,noteUrl:'https://git.example.test/mr/1#note_1'}})
  let tree = view.render()
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

test('评审完成和本轮结束同时显示；Draft、未验证仍单独保留', () => {
  const view = dashboard({runId:'run_aaaaaaaaaaaa',flowStatus:'completed',stage:'mrReviewed',reviewSubmitted:true,questions:[],
    mrReview:{completed:true,draft:true,noteUrl:'https://git.example.test/mr/1#note_1'},
    mrReviewNote:'远程评审已完成 · MR 保持 Draft',qa:{status:'completed',unverified:true}})
  const text = view.texts(view.render())
  assert.match(text,/本轮已结束/)
  assert.match(text,/评审完成/)
  assert.match(text,/MR 保持 Draft/)
  assert.match(text,/独立验证结果 · 未验证/)
  assert.match(text,/查看完整评审意见/)
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
