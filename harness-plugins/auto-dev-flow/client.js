window.__ModuleLoader__.load({
  id: '@local/auto-dev-flow',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const storageKey = 'auto-dev-flow:v1'
    const stages = ['intake', 'requirements', 'reproduction', 'reproSkipped', 'implementation', 'tests', 'mrPreparation', 'mrReview', 'acceptance', 'archive']
    const zh = {
      nav: '自动化开发',
      pageTitle: '自动化开发', subtitle: '从 PingCode 待办进入需求确认、开发测试和 GitLab 评审',
      localNotice: '每个工作项将从 origin/master 创建独立分支和 Orca worktree。流程备注保存在本机。',
      pingcodeTitle: '我的 PingCode 待办', refresh: '刷新 PingCode', search: '搜索编号、标题、类型或状态',
      pingcodeLoading: '正在读取 PingCode 待办…', pingcodeEmpty: '当前没有未完成的 PingCode 待办。',
      viewDetails: '查看详情', itemDetails: 'PingCode 工作项详情', close: '关闭', detailLoading: '正在读取工作项详情…',
      pingcodeError: '读取 PingCode 失败', actionError: '操作失败', chooseRepo: 'Orca 仓库', addIds: '输入 PingCode 编号或链接，多个用空格或逗号分隔',
      addSelection: '加入选择', selected: '已选', handoff: '从 master 创建 worktree 并交给 Agent',
      startupInstructions: '本次开发说明（可选，统一传给本次选中的工作项）', startupPlaceholder: '例如：不需要复现 Bug；按需求直接开发。跳过哪些测试、需要保留哪些验证，也可以写在这里。',
      analysisWorker: '需求分析子 Worker', waitingAnalysis: '等待 Orca 创建需求分析 Worker…', noQuestions: '目前没有待确认的问题。',
      coordinatorMissing: '尚未找到此 worktree 的 Orca coordinator；待确认问题暂时无法同步。', runMissing: 'coordinator 尚未创建本工单的 Orca Run；待确认问题暂时无法同步。',
      analysisTaskMissing: 'Orca Run 已创建，但尚未创建需求分析 Task。', workerMissing: '需求分析 Task 已创建，等待 Codex 子 Worker 启动。',
      pendingQuestions: '待确认问题', answerPlaceholder: '在 Harness 中回答这个业务问题…', sendAnswer: '提交答复', sendingAnswer: '提交中…',
      requirementsReview: '需求评审结论', waitingReview: '等待需求分析 Worker 完成并回传结论…', confirmRequirements: '确认需求并继续',
      requirementsConfirmed: '已在 Harness 确认需求，已通知 Orca coordinator。',
      selectRepo: '请先选择 Orca Git 仓库。', noSelection: '请先选择 PingCode 工作项。', starting: '正在创建 worktree 并启动 Agent…',
      flows: '开发流程', details: '流程详情', empty: '暂无开发流程。勾选 PingCode 待办并交给 Agent 后会显示在这里。',
      selectHint: '选择一条开发流程查看详情。', bugId: 'PingCode 编号', workTitle: '标题', repository: '仓库',
      typeName: '类型', stateName: '状态', branch: '开发分支',
      pingcodeUrl: 'PingCode 链接', gitlabMrUrl: 'GitLab MR 链接', currentStage: '当前阶段', status: '状态', updated: '最后更新',
      storageError: '本机保存失败，本次修改可能不会保留。', active: '进行中', paused: '已暂停', completed: '已完成',
      runId: 'Harness / Orca Run ID', taskId: 'Orca Task ID', dispatchId: 'Orca Dispatch ID', worktree: '工作区 / Worktree',
      agent: 'Agent', agentRole: 'Agent 职责', pause: '暂停', resume: '恢复', openMr: '打开 GitLab MR',
      cleanup: '删除编排、worktree 和分支', cleanupConfirm: bugId => `将删除 ${bugId} 对应的 Orca 编排记录、专属 worktree 目录和本地 Git 分支；worktree 内未提交内容也会删除。仅执行能确认属于该工单的目标，是否继续？`, cleanupStarted: '已启动定向清理 Agent',
      deleteFlow: '删除流程记录', deleteFlowConfirm: bugId => `仅从本机开发流程列表删除 ${bugId} 及其备注；不会删除 PingCode 工作项或 Orca 资源。是否继续？`,
      notes: '时间线备注', noNotes: '还没有备注。', notePlaceholder: '记录进展或交接信息…', addNote: '添加备注', runtimeInfo: '运行信息',
      createdNote: '已交给 Agent', pausedNote: '已暂停流程', resumedNote: '已恢复流程', stageChanged: '阶段变更',
      stage_intake: '需求接收', stage_requirements: '需求确认', stage_reproduction: '复现', stage_reproSkipped: '跳过复现',
      stage_implementation: '开发实现', stage_tests: '测试', stage_mrPreparation: '提交 MR', stage_mrReview: 'MR 评审', stage_acceptance: '验收', stage_archive: '归档'
    }
    const cssText = `
      .adf { height:100%; overflow:auto; padding:24px clamp(16px,2.5vw,36px); color:var(--dsw-alias-label-primary); }
      .adf__inner { max-width:1480px; margin:0 auto; }
      .adf__header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:18px; }
      .adf__title { margin:0; font-size:24px; line-height:1.3; font-weight:650; letter-spacing:-.02em; }
      .adf__subtitle { margin:5px 0 0; color:var(--dsw-alias-label-secondary); font-size:13px; }
      .adf__button { min-height:34px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); padding:7px 11px; font:inherit; font-size:12px; cursor:pointer; transition:background-color .16s,border-color .16s,transform .16s; }
      .adf__button:hover:not(:disabled) { border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-bg-layer-2); }
      .adf__button:active:not(:disabled) { transform:translateY(1px); }
      .adf__button:focus-visible,.adf__input:focus-visible,.adf__select:focus-visible,.adf__textarea:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
      .adf__button:disabled { opacity:.48; cursor:not-allowed; }
      .adf__button--primary { background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-bg-base); border-color:var(--dsw-alias-brand-primary); }
      .adf__button--danger { color:var(--dsw-alias-state-error-primary); }
      .adf__notice { margin:0 0 16px; padding:10px 13px; border:1px solid var(--dsw-alias-border-l1); border-left:3px solid var(--dsw-alias-brand-primary); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font-size:12px; }
      .adf__error { color:var(--dsw-alias-state-error-primary); }
      .adf__layout { display:block; }
      .adf__pingcode { margin-bottom:16px; }
      .adf__panel-title--spread { display:flex; justify-content:space-between; align-items:center; gap:12px; }
      .adf__toolbar { display:flex; align-items:center; gap:8px; padding:12px 14px 0; }
      .adf__toolbar .adf__select { max-width:420px; }
      .adf__search { flex:1; }
      .adf__startup-instructions { padding:10px 14px 12px; }
      .adf__panel { min-width:0; border:1px solid var(--dsw-alias-border-l1); border-radius:11px; overflow:hidden; background:var(--dsw-alias-bg-layer-1); }
      .adf__panel-title { min-height:44px; display:flex; align-items:center; padding:10px 14px; border-bottom:1px solid var(--dsw-alias-border-l1); font-size:13px; font-weight:620; }
      .adf__table-wrap { overflow:auto; }
      .adf__table { width:100%; min-width:790px; border-collapse:collapse; text-align:left; }
      .adf__table th { padding:10px 11px; color:var(--dsw-alias-label-secondary); font-size:11px; font-weight:600; white-space:nowrap; border-bottom:1px solid var(--dsw-alias-border-l1); }
      .adf__table td { padding:10px 11px; border-bottom:1px solid var(--dsw-alias-border-l1); font-size:12px; vertical-align:middle; }
      .adf__pingcode-table { table-layout:fixed; }
      .adf__pingcode-table th:nth-child(1) { width:5%; }
      .adf__pingcode-table th:nth-child(2) { width:14%; }
      .adf__pingcode-table th:nth-child(3) { width:43%; }
      .adf__pingcode-table th:nth-child(4) { width:13%; }
      .adf__pingcode-table th:nth-child(5) { width:11%; }
      .adf__pingcode-table th:nth-child(6) { width:14%; }
      .adf__pingcode-table td:nth-child(3) { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .adf__pingcode-table td:nth-child(4),.adf__pingcode-table td:nth-child(5),.adf__pingcode-table td:nth-child(6) { white-space:nowrap; }
      .adf__pingcode-table .adf__button { white-space:nowrap; }
      .adf__flow-table { min-width:0; table-layout:fixed; }
      .adf__flow-table th:nth-child(1) { width:13%; }
      .adf__flow-table th:nth-child(2) { width:29%; }
      .adf__flow-table th:nth-child(3) { width:14%; }
      .adf__flow-table th:nth-child(4) { width:14%; }
      .adf__flow-table th:nth-child(5) { width:12%; }
      .adf__flow-table th:nth-child(6) { width:13%; }
      .adf__flow-table th:nth-child(7) { width:5%; }
      .adf__flow-table td:nth-child(2),.adf__flow-table td:nth-child(3) { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .adf__flow-table td:last-child { white-space:nowrap; color:var(--dsw-alias-label-secondary); font-variant-numeric:tabular-nums; }
      .adf__row { cursor:pointer; transition:background-color .14s; }
      .adf__row:hover { background:var(--dsw-alias-bg-layer-2); }
      .adf__row--selected { background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,var(--dsw-alias-bg-layer-1)); }
      .adf__row--selected td:first-child { box-shadow:inset 3px 0 var(--dsw-alias-brand-primary); }
      .adf__expand-cell { width:74px; text-align:right; color:var(--dsw-alias-label-secondary); font-size:11px !important; white-space:nowrap; }
      .adf__flow-backdrop { position:fixed; inset:0; z-index:900; display:flex; justify-content:flex-end; background:rgba(18,25,35,.32); }
      .adf__flow-drawer { display:flex; flex-direction:column; width:min(700px,92vw); height:100%; min-height:0; border-left:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); box-shadow:-18px 0 48px rgba(0,0,0,.16); }
      .adf__flow-drawer-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 20px; border-bottom:1px solid var(--dsw-alias-border-l1); }
      .adf__flow-drawer-head h2 { margin:0; font-size:15px; }
      .adf__flow-drawer-close { width:32px; min-height:32px; padding:0; border-radius:50%; font-size:20px; line-height:1; }
      .adf__flow-drawer-body { min-height:0; overflow:auto; overscroll-behavior:contain; }
      .adf__id { color:var(--dsw-alias-brand-primary); font-weight:650; white-space:nowrap; }
      .adf__pill { display:inline-flex; align-items:center; padding:3px 8px; border:1px solid var(--dsw-alias-border-l1); border-radius:7px; font-size:11px; white-space:nowrap; }
      .adf__empty { padding:30px 16px; text-align:center; color:var(--dsw-alias-label-secondary); font-size:13px; }
      .adf__details { min-width:0; padding:14px; }
      .adf__flow-drawer-body .adf__details { padding:16px 20px; }
      .adf__detail-head { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:12px; }
      .adf__detail-title { margin:0; font-size:16px; line-height:1.4; }
      .adf__field-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .adf__field { display:flex; flex-direction:column; gap:5px; min-width:0; }
      .adf__field--wide { grid-column:1/-1; }
      .adf__label { color:var(--dsw-alias-label-secondary); font-size:11px; }
      .adf__input,.adf__select,.adf__textarea { box-sizing:border-box; width:100%; min-width:0; border:1px solid var(--dsw-alias-border-l1); border-radius:7px; padding:8px 9px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; }
      .adf__textarea { min-height:66px; resize:vertical; }
      .adf__actions { display:flex; flex-wrap:wrap; gap:7px; margin:12px 0; }
      .adf__notes { margin-top:16px; border-top:1px solid var(--dsw-alias-border-l1); padding-top:12px; }
      .adf__question { margin:8px 0; padding:10px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-2); }
      .adf__question-title { margin:0 0 7px; font-size:12px; font-weight:600; }
      .adf__review-body { white-space:pre-wrap; overflow-wrap:anywhere; font-size:12px; }
      .adf__review-frame { display:block; width:100%; min-height:700px; margin:10px 0; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:#fff; }
      .adf__notes-title { margin:0 0 9px; font-size:13px; }
      .adf__metadata { margin-top:14px; border-top:1px solid var(--dsw-alias-border-l1); padding-top:11px; }
      .adf__metadata-summary { color:var(--dsw-alias-label-secondary); font-size:12px; font-weight:600; cursor:pointer; }
      .adf__metadata-summary:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:3px; }
      .adf__metadata[open] .adf__metadata-summary { margin-bottom:11px; }
      .adf__note-list { display:flex; flex-direction:column; gap:8px; max-height:190px; overflow:auto; margin:0; padding:0; list-style:none; }
      .adf__note { padding:8px 9px; border-radius:8px; background:var(--dsw-alias-bg-layer-2); font-size:12px; overflow-wrap:anywhere; }
      .adf__note time { display:block; margin-bottom:3px; color:var(--dsw-alias-label-secondary); font-size:10px; }
      .adf__note-compose { display:flex; gap:7px; margin-top:9px; }
      .adf__note-compose .adf__textarea { flex:1; min-width:0; min-height:38px; }
      .adf__note-compose .adf__button { flex:0 0 auto; white-space:nowrap; }
      .adf__form { padding:14px; margin-bottom:16px; border:1px solid var(--dsw-alias-border-l1); border-radius:11px; background:var(--dsw-alias-bg-layer-1); }
      .adf__form h2 { margin:0 0 12px; font-size:15px; }
      .adf__form-actions { display:flex; gap:8px; margin-top:12px; }
      .adf__link { color:var(--dsw-alias-brand-primary); text-decoration:none; }
      .adf__link:hover { text-decoration:underline; }
      .adf__modal-backdrop { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:24px; background:rgba(15,23,42,.48); }
      .adf__modal { width:min(760px,100%); max-height:min(82vh,900px); overflow:auto; border:1px solid var(--dsw-alias-border-l1); border-radius:14px; background:var(--dsw-alias-bg-layer-1); box-shadow:0 24px 80px rgba(0,0,0,.24); }
      .adf__modal-head { position:sticky; top:0; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:15px 18px; border-bottom:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); }
      .adf__modal-head h2 { margin:0; font-size:17px; }
      .adf__modal-body { display:grid; grid-template-columns:1fr 1fr; gap:14px; padding:18px; }
      .adf__modal-value { overflow-wrap:anywhere; white-space:pre-wrap; font-size:13px; }
      .adf__modal-description { grid-column:1/-1; }
      .adf__question-modal { width:min(560px,100%); max-height:min(76vh,720px); }
      .adf__question-options { display:grid; gap:7px; margin:12px 0; }
      .adf__question-options .adf__button { text-align:left; }
      .adf__description-image { display:block; max-width:100%; max-height:60vh; object-fit:contain; margin-top:12px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; }
      .adf__description-image-link { display:block; margin-top:8px; color:var(--dsw-alias-link); }
      .adf__toolbar--filters { display:grid; grid-template-columns:minmax(150px,.9fr) minmax(220px,1.4fr) minmax(130px,.7fr) minmax(130px,.7fr); padding:12px 14px 0; }
      .adf__toolbar--selection { display:grid; grid-template-columns:minmax(200px,1fr) auto auto auto; padding-top:8px; }
      .adf__selection-count { align-self:center; color:var(--dsw-alias-label-secondary); font-size:12px; white-space:nowrap; }
      .adf__startup-instructions { padding:8px 14px 2px; }
      .adf__startup-summary { color:var(--dsw-alias-label-secondary); font-size:12px; cursor:pointer; }
      .adf__startup-summary span { margin-left:8px; font-weight:400; }
      .adf__startup-instructions .adf__field { margin-top:8px; }
      .adf__list-heading { display:flex; align-items:baseline; gap:10px; }
      .adf__list-heading small { color:var(--dsw-alias-label-secondary); font-size:11px; font-weight:400; }
      .adf__panel-title > .adf__select { width:auto; max-width:180px; min-height:34px; }
      .adf__pingcode-table .adf__button { min-height:30px; padding:5px 10px; border-radius:8px; }
      .adf__pagination { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 14px; border-top:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); font-size:12px; }
      .adf__pagination-size,.adf__pagination-pages { display:flex; align-items:center; gap:5px; }
      .adf__pagination-size .adf__select { width:auto; min-height:30px; padding:5px 8px; }
      .adf__pagination .adf__button { min-height:30px; padding:5px 9px; }
      .adf__pagination-current { min-width:28px; text-align:center; color:var(--dsw-alias-label-primary); }
      .adf__pagination-ellipsis { padding:0 2px; }
      .adf__flow-table .adf__expand-cell .adf__button { min-height:30px; padding:5px 9px; border-radius:8px; }
      .adf__flow-table .adf__expand-cell .adf__flow-action { border:0; background:transparent; color:var(--dsw-alias-label-primary); text-decoration:underline; text-underline-offset:3px; }
      @media(max-width:600px) { .adf__flow-drawer { width:100%; } .adf__flow-drawer-body .adf__details { padding:14px; } }
      @media(max-width:700px) { .adf__toolbar { align-items:stretch; flex-direction:column; } .adf__toolbar--filters,.adf__toolbar--selection { display:flex; flex-direction:column; } .adf__toolbar .adf__select { max-width:none; } .adf__selection-count { align-self:flex-start; } .adf__pagination { align-items:flex-start; flex-direction:column; } }
      @media(max-width:600px) { .adf__header { align-items:flex-start; flex-direction:column; } .adf__field-grid { grid-template-columns:minmax(0,1fr); } .adf__field--wide { grid-column:auto; } }
    `

    function readItems() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]')
        return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'object') : []
      } catch { return [] }
    }

    function timeLabel(value, locale, compact = false) {
      if (!value) return '—'
      const date = new Date(value)
      const options = compact ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } : { dateStyle: 'medium', timeStyle: 'short' }
      return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(locale || undefined, options).format(date)
    }

    function externalLink(value, label, onClick) {
      if (!value) return label
      try {
        const url = new URL(value)
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return label
        return h('a', { className: 'adf__link', href: url.href, target: '_blank', rel: 'noreferrer', onClick }, label)
      } catch { return label }
    }

    function Icon() {
      return h('svg', { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M4 4.5h16v15H4z' }),
        h('path', { d: 'M8 8.5h8M8 12h8M8 15.5h5' }),
        h('circle', { cx: 17, cy: 15.5, r: 1 })
      )
    }

    function Dashboard({ ctx }) {
      const [items, setItems] = React.useState(readItems)
      const [workItems, setWorkItems] = React.useState([])
      const [summary, setSummary] = React.useState(null)
      const [repos, setRepos] = React.useState([])
      const [repoId, setRepoId] = React.useState('')
      const [selectedWorkItemIds, setSelectedWorkItemIds] = React.useState([])
      const [search, setSearch] = React.useState('')
      const [workItemTypeFilter, setWorkItemTypeFilter] = React.useState('')
      const [workItemStateFilter, setWorkItemStateFilter] = React.useState('')
      const [workItemPage, setWorkItemPage] = React.useState(0)
      const [workItemPageSize, setWorkItemPageSize] = React.useState(5)
      const [manualIds, setManualIds] = React.useState('')
      const [creationInstructions, setCreationInstructions] = React.useState('')
      const [loading, setLoading] = React.useState(true)
      const [starting, setStarting] = React.useState(false)
      const [cleaning, setCleaning] = React.useState(false)
      const [deletingFlowId, setDeletingFlowId] = React.useState('')
      const [error, setError] = React.useState('')
      const [selectedId, setSelectedId] = React.useState(null)
      const [workItemDetail, setWorkItemDetail] = React.useState(null)
      const [detailLoading, setDetailLoading] = React.useState(false)
      const [detailError, setDetailError] = React.useState('')
      const [progressSaving, setProgressSaving] = React.useState(false)
      const [continueDraft, setContinueDraft] = React.useState('')
      const [continuing, setContinuing] = React.useState(false)
      const [interruptReason, setInterruptReason] = React.useState('')
      const [interruptingDispatchId, setInterruptingDispatchId] = React.useState('')
      const [orcaState, setOrcaState] = React.useState(null)
      const [orcaStateError, setOrcaStateError] = React.useState('')
      const orcaRefreshRef = React.useRef(null)
      const [orcaRefreshing, setOrcaRefreshing] = React.useState(false)
      const [orcaLastRefreshedAt, setOrcaLastRefreshedAt] = React.useState('')
      const [answerDrafts, setAnswerDrafts] = React.useState({})
      const [answeredQuestionIds, setAnsweredQuestionIds] = React.useState([])
      const [answeringQuestionId, setAnsweringQuestionId] = React.useState('')
      const [questionDialogId, setQuestionDialogId] = React.useState('')
      const [dismissedQuestionIds, setDismissedQuestionIds] = React.useState([])
      const [confirmingRequirements, setConfirmingRequirements] = React.useState(false)
      const [submittingReview, setSubmittingReview] = React.useState(false)
      const [noteDraft, setNoteDraft] = React.useState('')
      const [flowStatusFilter, setFlowStatusFilter] = React.useState('')
      const [persistenceError, setPersistenceError] = React.useState(false)
      const t = key => zh[key] || key
      const currentLocale = 'zh-CN'
      const selected = items.find(item => item.id === selectedId) || null
      const answeredQuestionSet = [...new Set([...(selected?.answeredQuestionIds || []), ...answeredQuestionIds])]
      const knownQuestions = new Map((selected?.pendingOrcaQuestions || []).map(question => [question.id, question]))
      for (const question of orcaState?.questions || []) {
        if (!answeredQuestionSet.includes(question.id)) knownQuestions.set(question.id, question)
      }
      const pendingOrcaQuestions = [...knownQuestions.values()].filter(question => !answeredQuestionSet.includes(question.id))
      const workItemTypes = [...new Set(workItems.map(item => item.typeName).filter(Boolean))].sort((a, b) => a.localeCompare(b, currentLocale))
      const workItemStates = [...new Set(workItems.map(item => item.state?.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, currentLocale))
      const filteredWorkItems = workItems.filter(item => {
        const query = search.trim().toLowerCase()
        return (!query || `${item.identifier} ${item.title} ${item.typeName} ${item.state?.name}`.toLowerCase().includes(query)) &&
          (!workItemTypeFilter || item.typeName === workItemTypeFilter) &&
          (!workItemStateFilter || item.state?.name === workItemStateFilter)
      })
      const pageCount = Math.max(1, Math.ceil(filteredWorkItems.length / workItemPageSize))
      const currentWorkItemPage = Math.min(workItemPage, pageCount - 1)
      const visibleWorkItems = filteredWorkItems.slice(currentWorkItemPage * workItemPageSize, (currentWorkItemPage + 1) * workItemPageSize)
      const visibleWorkItemIds = visibleWorkItems.map(item => item.id)
      const selectedVisibleWorkItemCount = visibleWorkItemIds.filter(id => selectedWorkItemIds.includes(id)).length
      const pageNumbers = Array.from({ length: pageCount }, (_, index) => index).filter(index =>
        index === 0 || index === pageCount - 1 || Math.abs(index - currentWorkItemPage) <= 1
      )
      const visibleFlows = items.filter(item => !flowStatusFilter || (flowStatusFilter === 'paused'
        ? item.paused
        : flowStatusFilter === 'completed' ? item.status === 'completed' : !item.paused && item.status !== 'completed'))

      React.useEffect(() => {
        if (workItemPage !== currentWorkItemPage) setWorkItemPage(currentWorkItemPage)
      }, [workItemPage, currentWorkItemPage])

      React.useEffect(() => {
        if (!selectedId) return
        const closeOnEscape = event => { if (event.key === 'Escape') setSelectedId(null) }
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
      }, [selectedId])

      async function refreshPingCode() {
        setLoading(true)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/pingcode/items')
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          setWorkItems(Array.isArray(result.items) ? result.items : [])
          setSummary(result.summary || null)
        } catch (cause) { setError(cause?.message || String(cause)) }
        finally { setLoading(false) }
      }

      async function showWorkItemDetails(workItem) {
        setWorkItemDetail(null)
        setDetailError('')
        setDetailLoading(true)
        try {
          const query = new URLSearchParams({ identifier: workItem.identifier || '' })
          const response = await fetch(`/auto-dev-flow/pingcode/item?${query}`)
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          setWorkItemDetail(result.item)
        } catch (cause) { setDetailError(cause?.message || String(cause)) }
        finally { setDetailLoading(false) }
      }

      React.useEffect(() => {
        refreshPingCode()
        fetch('/auto-dev-flow/orca/repos').then(response => response.json()).then(result => {
          if (!result.ok) throw new Error(result.error || '读取 Orca 仓库失败')
          setRepos(Array.isArray(result.repos) ? result.repos : [])
          if (result.repos?.[0]) setRepoId(result.repos[0].id)
        }).catch(cause => setError(cause?.message || String(cause)))
      }, [])

      React.useEffect(() => {
        let current = true
        let timer
        async function refresh(manual = false) {
          if (!selected?.worktree) { setOrcaState(null); return }
          if (manual) setOrcaRefreshing(true)
          try {
            const query = new URLSearchParams({
              bugId: selected.bugId, repoId: repoIdFor(selected), worktree: selected.worktree,
              runId: selected.runId || '', coordinatorTerminal: selected.coordinatorTerminal || ''
            })
            const response = await fetch(`/auto-dev-flow/orca/state?${query}`)
            const body = await response.text()
            if (!body.trim()) throw new Error(`Harness 状态接口返回空响应（HTTP ${response.status}）；本地插件后端可能未加载新版，请重启 Harness 后重试。`)
            let result
            try { result = JSON.parse(body) }
            catch { throw new Error(`Harness 状态接口返回的内容不是有效 JSON（HTTP ${response.status}）。`) }
            if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
            if (current) { setOrcaState(result.state); setOrcaStateError(''); setOrcaLastRefreshedAt(new Date().toISOString()) }
          } catch (cause) { if (current) { setOrcaStateError(cause?.message || String(cause)); setOrcaLastRefreshedAt(new Date().toISOString()) } }
          finally { if (current && manual) setOrcaRefreshing(false) }
        }
        setOrcaState(null)
        setOrcaStateError('')
        setOrcaLastRefreshedAt('')
        setOrcaRefreshing(false)
        setAnsweredQuestionIds([])
        setQuestionDialogId('')
        setDismissedQuestionIds([])
        orcaRefreshRef.current = refresh
        if (selected?.worktree) { refresh(); timer = setInterval(refresh, 8000) }
        return () => { current = false; if (orcaRefreshRef.current === refresh) orcaRefreshRef.current = null; if (timer) clearInterval(timer) }
      }, [selected?.id, selected?.runId, selected?.coordinatorTerminal, selected?.worktree, selected?.repoId, repos])

      React.useEffect(() => {
        if (!selected?.id || !orcaState) return
        const stage = selected.requirementsConfirmedAt && orcaState.stage === 'requirements' ? selected.stage : orcaState.stage
        const patch = {}
        if (stage && selected.stage !== stage) patch.stage = stage
        if (orcaState.gitlabMrUrl && selected.gitlabMrUrl !== orcaState.gitlabMrUrl) patch.gitlabMrUrl = orcaState.gitlabMrUrl
        if (Object.keys(patch).length) updateItem(selected.id, patch,
          patch.gitlabMrUrl ? 'GitLab MR 已关联到当前流程' : `${t('stageChanged')}: ${stageLabel(stage)}（从 Orca 同步）`)
      }, [selected?.id, selected?.stage, selected?.gitlabMrUrl, orcaState?.stage, orcaState?.gitlabMrUrl])

      React.useEffect(() => {
        const question = pendingOrcaQuestions.find(item =>
          !answeredQuestionSet.includes(item.id) && !dismissedQuestionIds.includes(item.id))
        if (question && selected?.id) setQuestionDialogId(question.id)
        else if (!pendingOrcaQuestions.some(item => item.id === questionDialogId)) setQuestionDialogId('')
      }, [selected?.id, selected?.answeredQuestionIds, selected?.pendingOrcaQuestions, orcaState?.questions, answeredQuestionIds, dismissedQuestionIds, questionDialogId])

      React.useEffect(() => {
        if (!selected?.id || !pendingOrcaQuestions.length) return
        const savedIds = new Set((selected.pendingOrcaQuestions || []).map(question => question.id))
        const added = pendingOrcaQuestions.filter(question => !savedIds.has(question.id))
        if (added.length) updateItem(selected.id, { pendingOrcaQuestions: pendingOrcaQuestions })
      }, [selected?.id, selected?.pendingOrcaQuestions, orcaState?.questions, answeredQuestionIds])

      function save(next) {
        setItems(next)
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next))
          setPersistenceError(false)
        } catch { setPersistenceError(true) }
      }

      function updateItem(id, patch, eventText) {
        const at = new Date().toISOString()
        save(items.map(item => item.id !== id ? item : {
          ...item, ...patch, updatedAt: at,
          notes: eventText ? [{ at, text: eventText }, ...(Array.isArray(item.notes) ? item.notes : [])] : item.notes
        }))
      }

      function cleanupAlreadyRequested(item) {
        return Boolean(item?.cleanupRequestedAt || item?.notes?.some(note => String(note.text || '').startsWith(t('cleanupStarted'))))
      }

      function repoIdFor(item) {
        return item.repoId || repos.find(repo => repo.displayName === item.repository)?.id || ''
      }

      async function changeStage(item, stage) {
        const repoId = repoIdFor(item)
        if (!repoId || !item.worktree) { setError('此流程缺少 Orca worktree 信息，无法同步阶段。'); return }
        setProgressSaving(true)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/orca/progress', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ bugId: item.bugId, repoId, worktree: item.worktree, stage })
          })
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          updateItem(item.id, { stage }, `${t('stageChanged')}: ${stageLabel(stage)}（已同步 Orca）`)
        } catch (cause) { setError(`同步 Orca 阶段失败：${cause?.message || String(cause)}`) }
        finally { setProgressSaving(false) }
      }

      async function continueInOrca(item) {
        const instruction = continueDraft.trim()
        const repoId = repoIdFor(item)
        if (!repoId || !item.worktree) { setError('此流程缺少 Orca 仓库或 worktree 信息，无法继续发送。'); return }
        if (!instruction) return
        setContinuing(true)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/orca/continue', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ bugId: item.bugId, repoId, worktree: item.worktree, instruction })
          })
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          updateItem(item.id, {}, `续办指令已发送到 Orca coordinator（Run ${result.runId}）`)
          setContinueDraft('')
        } catch (cause) { setError(`发送续办指令到 Orca 失败：${cause?.message || String(cause)}`) }
        finally { setContinuing(false) }
      }

      async function interruptWorker(item, worker) {
        const reason = interruptReason.trim()
        if (!reason) return
        setInterruptingDispatchId(worker.dispatchId)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/orca/interrupt', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              bugId: item.bugId, repoId: repoIdFor(item), worktree: item.worktree,
              runId: orcaState?.runId, coordinatorTerminal: orcaState?.coordinatorTerminal,
              dispatchId: worker.dispatchId, reason
            })
          })
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          updateItem(item.id, {}, `${worker.taskTitle} 已中断（${worker.dispatchId}）；${reason}；本次未验证。${result.fenced ? '' : 'Dispatch 隔离未确认，请核对。'}${result.recorded ? '' : 'Orca Task 状态未确认，请核对。'}${result.coordinatorNotified ? 'Orca 已接受续办指令，等待接续。' : 'Orca 通知未确认，请人工核对。'}`)
          setInterruptReason('')
        } catch (cause) { setError(`中断 Worker 失败：${cause?.message || String(cause)}`) }
        finally { setInterruptingDispatchId('') }
      }

      async function answerOrcaQuestion(item, question) {
        const answer = String(answerDrafts[question.id] || '').trim()
        if (!answer) return
        setAnsweringQuestionId(question.id)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/orca/answer', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              bugId: item.bugId, repoId: repoIdFor(item), worktree: item.worktree,
              runId: orcaState?.runId || item.runId, coordinatorTerminal: orcaState?.coordinatorTerminal || item.coordinatorTerminal,
              messageId: question.id, answer
            })
          })
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          const answeredIds = [...new Set([...answeredQuestionSet, question.id])]
          setAnsweredQuestionIds(answeredIds)
          setAnswerDrafts(drafts => ({ ...drafts, [question.id]: '' }))
          updateItem(item.id, { answeredQuestionIds: answeredIds }, result.coordinatorNotified
            ? '已通过 Harness 答复 Orca 问题，并通知 coordinator 继续流程'
            : '已通过 Harness 答复 Orca 问题；coordinator 通知未确认，请刷新 Orca 状态')
        } catch (cause) { setError(`答复 Orca 问题失败：${cause?.message || String(cause)}`) }
        finally { setAnsweringQuestionId('') }
      }

      async function confirmRequirements(item) {
        if (item.requirementsConfirmedAt || [orcaState?.stage, item.stage].some(stage => stages.indexOf(stage) > stages.indexOf('requirements'))
          || !orcaState?.review || pendingOrcaQuestions.length) return
        setConfirmingRequirements(true)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/orca/requirements/confirm', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              bugId: item.bugId, repoId: repoIdFor(item), worktree: item.worktree,
              runId: orcaState.runId, coordinatorTerminal: orcaState.coordinatorTerminal,
              ...(item.confirmRetryRequestId ? { retryRequestId: item.confirmRetryRequestId } : {})
            })
          })
          const result = await response.json()
          if (!response.ok || !result.ok) {
            if (result.code === 'agent_prompt_blocked' && result.retryRequestId) updateItem(item.id, { confirmRetryRequestId: result.retryRequestId })
            throw new Error(result.error || `${response.status}`)
          }
          const at = new Date().toISOString()
          updateItem(item.id, { requirementsConfirmedAt: at, runId: result.runId, stage: 'requirements', confirmRetryRequestId: '' }, t('requirementsConfirmed'))
        } catch (cause) { setError(`确认需求失败：${cause?.message || String(cause)}`) }
        finally { setConfirmingRequirements(false) }
      }

      async function submitReview(item) {
        if (!orcaState?.reviewReady) return
        setSubmittingReview(true)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/orca/review/submit', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              bugId: item.bugId, repoId: repoIdFor(item), worktree: item.worktree,
              runId: orcaState.runId, coordinatorTerminal: orcaState.coordinatorTerminal
            })
          })
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          updateItem(item.id, { reviewSubmittedAt: new Date().toISOString(), stage: 'mrPreparation' },
            result.stageSynced === false ? 'MR 提交指令已送达 Orca；worktree 阶段待同步' : '已通过 Harness 启动 MR 提交流程')
        } catch (cause) { setError(`提交 Review 失败：${cause?.message || String(cause)}`) }
        finally { setSubmittingReview(false) }
      }

      function addNote() {
        if (!selected || !noteDraft.trim()) return
        const at = new Date().toISOString()
        save(items.map(item => item.id !== selected.id ? item : {
          ...item, updatedAt: at, notes: [{ at, text: noteDraft.trim() }, ...(Array.isArray(item.notes) ? item.notes : [])]
        }))
        setNoteDraft('')
      }

      function addIdsToSelection() {
        const keys = manualIds.split(/[\s,，;；]+/).map(value => value.trim().toLowerCase()).filter(Boolean)
        const matches = workItems.filter(item => keys.some(key => item.identifier?.toLowerCase() === key || item.htmlUrl?.toLowerCase() === key))
        setSelectedWorkItemIds(ids => [...new Set([...ids, ...matches.map(item => item.id)])])
        const missing = keys.filter(key => !matches.some(item => item.identifier?.toLowerCase() === key || item.htmlUrl?.toLowerCase() === key))
        setError(missing.length ? `当前 PingCode 待办列表中找不到：${missing.join(', ')}` : '')
        setManualIds('')
      }

      async function handoffSelected() {
        if (!repoId) { setError(t('selectRepo')); return }
        const selectedItems = workItems.filter(item => selectedWorkItemIds.includes(item.id))
        if (!selectedItems.length) { setError(t('noSelection')); return }
        const developerInstructions = creationInstructions.trim()
        setStarting(true)
        setError('')
        const startedIds = []
        const createdFlows = []
        try {
          for (const workItem of selectedItems) {
            const response = await fetch('/auto-dev-flow/orca/start', {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ bugId: workItem.identifier, repoId, developerInstructions })
            })
            const result = await response.json()
            if (!response.ok || !result.ok) throw new Error(`${workItem.identifier}: ${result.error || response.status}`)
            const at = new Date().toISOString()
            const flowId = globalThis.crypto?.randomUUID?.() || `${workItem.id}-${Date.now()}`
            const flow = {
              id: flowId, bugId: workItem.identifier, title: workItem.title, repository: result.repo?.displayName || '', repoId,
              pingcodeUrl: workItem.htmlUrl, gitlabMrUrl: '', branch: result.branch || '',
              runId: result.launch?.runId || result.launch?.id || result.operationId || '',
              taskId: result.launch?.taskId || '', dispatchId: result.launch?.dispatchId || '',
              worktree: typeof result.worktree === 'string' ? result.worktree : result.worktree?.path || '',
              worktreeId: result.worktree?.id || result.worktree?.worktreeId || '',
              coordinatorTerminal: result.coordinatorTerminal || '',
              agent: 'Codex', agentRole: '研发 Agent', stage: 'intake', paused: false, status: 'active', updatedAt: at,
              notes: [{ at, text: t('createdNote') }, ...(developerInstructions ? [{ at, text: `创建说明：${developerInstructions}` }] : [])]
            }
            createdFlows.push(flow)
            startedIds.push(workItem.id)
            setSelectedId(flowId)
          }
        } catch (cause) { setError(cause?.message || String(cause)) }
        finally {
          if (createdFlows.length) {
            save([...createdFlows, ...items])
            setSelectedWorkItemIds(ids => ids.filter(id => !startedIds.includes(id)))
            if (startedIds.length === selectedItems.length) setCreationInstructions('')
          }
          setStarting(false)
        }
      }

      async function cleanupSelected() {
        const cleanupRepoId = selected?.repoId || repos.find(repo => repo.displayName === selected?.repository)?.id
        if (!selected || !cleanupRepoId) { setError('此流程缺少 Orca 仓库信息，请重新选择仓库创建流程。'); return }
        if (cleaning || cleanupAlreadyRequested(selected)) return
        if (!window.confirm(t('cleanupConfirm')(selected.bugId))) return
        setCleaning(true)
        setError('')
        try {
          const response = await fetch('/auto-dev-flow/orca/cleanup', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ bugId: selected.bugId, repoId: cleanupRepoId, runId: selected.runId, worktreeId: selected.worktreeId, worktree: selected.worktree, branch: selected.branch })
          })
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.error || `${response.status}`)
          updateItem(selected.id, { repoId: cleanupRepoId, cleanupRequestedAt: new Date().toISOString() }, `${t('cleanupStarted')}：${selected.bugId}`)
        } catch (cause) { setError(cause?.message || String(cause)) }
        finally { setCleaning(false) }
      }

      function deleteSelectedFlow() {
        if (deletingFlowId === selected?.id) return
        if (!selected || !window.confirm(t('deleteFlowConfirm')(selected.bugId))) return
        setDeletingFlowId(selected.id)
        save(items.filter(item => item.id !== selected.id))
        setSelectedId(null)
        setNoteDraft('')
      }

      function field(label, key, wide = false, link = false) {
        return h('label', { className: `adf__field${wide ? ' adf__field--wide' : ''}`, key },
          h('span', { className: 'adf__label' }, label),
          h('input', {
            className: 'adf__input', value: selected?.[key] || '',
            onChange: event => updateItem(selected.id, { [key]: event.target.value }),
            placeholder: label, type: link ? 'url' : 'text'
          })
        )
      }

      function detailValue(value, label) {
        if (value == null || value === '') return '—'
        if (typeof value === 'string') {
          if (label === '负责人' && /^\d{11}$/.test(value)) return '—'
          if (label !== '描述') return value
          return descriptionContent(value).text || '—'
        }
        if (typeof value === 'number' || typeof value === 'boolean') return '—'
        if (Array.isArray(value)) return value.map(entry => detailValue(entry, label)).filter(entry => entry !== '—').join('、') || '—'
        const labelValue = value.name ?? value.display_name ?? value.displayName ?? value.title
        return labelValue == null ? '—' : detailValue(labelValue, label)
      }

      function flowQuestionsAndReview(item) {
        if (item.id !== selected?.id) return null
        const state = orcaState
        const questions = pendingOrcaQuestions
        const qaResult = String(state?.qa?.result || '')
        const qaTestOutput = [...new Set([
          ...[...qaResult.matchAll(/\b([\w.$]+(?:Test|Tests))\s+(\d+)\s*\/\s*(\d+)\b/g)]
            .map(([, test, passed, total]) => `${test}: ${passed}/${total}`),
          ...[...qaResult.matchAll(/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+).*?-- in\s+([\w.$]+)/g)]
            .map(([, total, failures, errors, skipped, test]) => `${test}: ${total} run, ${failures} failed, ${errors} errors, ${skipped} skipped`)
        ])]
        const qaStatus = state?.qa?.skipped ? '未验证'
          : state?.qa?.status === 'failed' || (state?.qa?.status === 'completed' && (!state?.qa?.crossValidated || state?.qa?.outcome === 'failed')) ? '未通过'
            : state?.qa?.status === 'completed' ? '已完成' : '进行中'
        const question = questions.find(item => item.id === questionDialogId)
        const requirementsAlreadyPassed = Boolean(item.requirementsConfirmedAt)
          || [state?.stage, item.stage].some(stage => stages.indexOf(stage) > stages.indexOf('requirements'))
        const reportUrl = state?.review?.reportPath ? `/auto-dev-flow/orca/report?${new URLSearchParams({
          bugId: item.bugId, repoId: repoIdFor(item), worktree: item.worktree,
          runId: state.runId, coordinatorTerminal: state.coordinatorTerminal
        })}` : ''
        const stateMessage = {
          coordinator_missing: t('coordinatorMissing'), run_missing: t('runMissing'),
          analysis_task_missing: t('analysisTaskMissing'), worker_missing: t('workerMissing')
        }[state?.status]
        return h(React.Fragment, null,
          h('section', { className: 'adf__notes', 'aria-label': t('pendingQuestions') },
            h('h3', { className: 'adf__notes-title' }, t('pendingQuestions')),
            orcaStateError ? h('div', { className: 'adf__notice adf__error', role: 'alert' }, `读取 Orca 问题失败：${orcaStateError}`) : null,
            stateMessage ? h('div', { className: 'adf__notice', role: 'status' }, stateMessage) : null,
            !state ? h('div', { className: 'adf__label' }, t('waitingAnalysis')) : questions.length === 0 && !stateMessage
              ? h('div', { className: 'adf__label' }, t('noQuestions'))
              : questions.length ? h('div', { className: 'adf__actions' },
                h('span', { className: 'adf__label' }, `有 ${questions.length} 个问题待确认`),
                h('button', {
                  className: 'adf__button', onClick: () => setQuestionDialogId(questions[0].id)
                }, '打开待确认问题')
              ) : null,
            question ? h('div', { className: 'adf__modal-backdrop', onClick: () => {
              setDismissedQuestionIds(ids => [...new Set([...ids, question.id])])
              setQuestionDialogId('')
            } },
              h('section', {
                className: 'adf__modal adf__question-modal', role: 'dialog', 'aria-modal': true,
                'aria-labelledby': 'adf-orca-question-title', onClick: event => event.stopPropagation()
              },
                h('header', { className: 'adf__modal-head' },
                  h('h2', { id: 'adf-orca-question-title' }, question.subject || 'Orca 待确认问题'),
                  h('button', {
                    className: 'adf__button adf__flow-drawer-close',
                    onClick: () => {
                      setDismissedQuestionIds(ids => [...new Set([...ids, question.id])])
                      setQuestionDialogId('')
                    },
                    'aria-label': '稍后处理', title: '稍后处理'
                  }, '×')
                ),
                h('div', { className: 'adf__details' },
                  h('div', { className: 'adf__review-body' }, question.question),
                  question.options?.length ? h('div', { className: 'adf__question-options' }, ...question.options.map(option => h('button', {
                    className: 'adf__button', key: option,
                    onClick: () => setAnswerDrafts(drafts => ({ ...drafts, [question.id]: option }))
                  }, option))) : null,
                  h('div', { className: 'adf__note-compose' },
                    h('textarea', {
                      className: 'adf__textarea', value: answerDrafts[question.id] || '',
                      onChange: event => setAnswerDrafts(drafts => ({ ...drafts, [question.id]: event.target.value })),
                      placeholder: t('answerPlaceholder'), maxLength: 4000
                    }),
                    h('button', {
                      className: 'adf__button adf__button--primary',
                      onClick: () => answerOrcaQuestion(item, question),
                      disabled: answeringQuestionId === question.id || !String(answerDrafts[question.id] || '').trim()
                    }, answeringQuestionId === question.id ? t('sendingAnswer') : t('sendAnswer'))
                  )
                )
              )
            ) : null
          ),
          h('section', { className: 'adf__notes', 'aria-label': t('requirementsReview') },
            h('h3', { className: 'adf__notes-title' }, t('requirementsReview')),
            state?.analysisAgent ? h('div', { className: 'adf__label' }, `${t('analysisWorker')}: ${state.analysisAgent}${state.analysisModel ? ` · ${state.analysisModel}` : ''} · ${state.analysisState || 'working'}`) :
              h('div', { className: 'adf__label' }, t('waitingAnalysis')),
            state?.review ? h(React.Fragment, null,
              requirementsAlreadyPassed ? h('div', { className: 'adf__notice', role: 'status' }, '流程已进入后续阶段，需求确认已关闭。') : null,
              h('div', { className: 'adf__review-body' }, state.review.body || state.review.subject),
              reportUrl ? h(React.Fragment, null,
                h('a', { href: reportUrl, target: '_blank', rel: 'noopener noreferrer' }, '在新窗口查看完整需求评审页'),
                h('iframe', { className: 'adf__review-frame', src: reportUrl, title: `${item.bugId} 完整需求评审页`, sandbox: 'allow-scripts' })
              ) : null
            ) : h('div', { className: 'adf__label' }, t('waitingReview')),
            error?.startsWith('确认需求失败') ? h('div', { className: 'adf__notice adf__error', role: 'alert' }, error) : null,
            h('button', {
              className: 'adf__button adf__button--primary',
              onClick: event => { event.stopPropagation(); confirmRequirements(item) },
              disabled: requirementsAlreadyPassed || confirmingRequirements || !state?.review || questions.length > 0
            }, requirementsAlreadyPassed ? '需求确认已关闭' : confirmingRequirements ? '确认中…' : item.confirmRetryRequestId ? '重试需求确认' : t('confirmRequirements'))
          ),
          state?.qa ? h('section', { className: 'adf__notes', 'aria-label': '独立验证结果' },
            h('h3', { className: 'adf__notes-title' }, '独立验证结果'),
            h('div', { className: 'adf__label' }, `验证状态：${qaStatus}`),
            qaTestOutput.length
              ? h('ul', { className: 'adf__qa-results' }, ...qaTestOutput.map(result => h('li', { key: result }, result)))
              : h('div', { className: 'adf__label' }, state.qa.status === 'completed' ? '没有识别到测试用例输出。' : '等待测试用例输出。')
          ) : null,
          h('section', { className: 'adf__notes', 'aria-label': '提交与评审' },
            h('h3', { className: 'adf__notes-title' }, '提交与评审'),
            error?.startsWith('提交 Review 失败') ? h('div', { className: 'adf__notice adf__error', role: 'alert' }, error) : null,
            item.reviewSubmittedAt || state?.reviewSubmitted ? h('div', { className: 'adf__notice', role: 'status' }, state?.mrReviewNote || '指令已送达 Orca：核对当前改动，提交、推送分支并创建 GitLab MR，再进行正式代码评审。') :
              h('button', {
                className: 'adf__button adf__button--primary',
                onClick: event => { event.stopPropagation(); submitReview(item) },
                disabled: submittingReview || !state?.reviewReady
              }, submittingReview ? '提交中…' : '提交 Review'),
            state?.qaSkipped && !state?.reviewSubmitted ? h('div', { className: 'adf__label' }, '独立验证已由用户中断，本次未验证；后续评审需保留此记录。') : null,
            !state?.reviewReady && !item.reviewSubmittedAt && !state?.reviewSubmitted
              ? h('div', { className: 'adf__label' }, '等待开发与独立验证完成。') : null
          )
        )
      }

      function descriptionContent(value) {
        const document = new DOMParser().parseFromString(String(value).replace(/<\/p\s*>|<br\s*\/?>/gi, '\n'), 'text/html')
        const images = []
        const addImage = (source, alt = '') => {
          try {
            const url = new URL(source)
            if (url.protocol === 'https:' && url.hostname === 'atlas.pingcode.com' && url.pathname.startsWith('/files/')) {
              if (!images.some(image => image.src === url.href)) images.push({ src: url.href, alt })
            }
          } catch {}
        }
        document.querySelectorAll('img').forEach(image => addImage(image.getAttribute('src') || '', image.getAttribute('alt') || 'PingCode 附件'))
        const text = document.body.textContent.replace(/https?:\/\/[^\s"<>]+/g, url => {
          addImage(url)
          return ''
        }).trim()
        return { text, images }
      }

      function workItemDetailField(label, value, wide = false) {
        const displayValue = detailValue(value, label)
        const description = label === '描述' && typeof value === 'string' ? descriptionContent(value) : null
        return h('div', { className: `adf__field${wide ? ' adf__modal-description' : ''}`, key: label },
          h('span', { className: 'adf__label' }, label),
          h('div', { className: 'adf__modal-value' },
            label === '负责人' && /^\d{11}$/.test(displayValue) ? '—' : displayValue,
            ...((description?.images || []).map((image, index) => {
              const imageUrl = new URL(image.src)
              if (workItemDetail?.public_image_token) imageUrl.searchParams.set('token', workItemDetail.public_image_token)
              return h('div', { key: `${image.src}-${index}` },
              h('img', {
                className: 'adf__description-image', src: imageUrl.href, alt: image.alt,
                loading: 'lazy', referrerPolicy: 'no-referrer',
                onError: event => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false }
              }),
              h('a', {
                className: 'adf__description-image-link', href: selected?.pingcodeUrl || '#',
                target: '_blank', rel: 'noopener noreferrer', hidden: true
              }, '图片无法内嵌加载，点击在 PingCode 查看工作项')
            )}))
          )
        )
      }

      const stageLabel = stage => t(`stage_${stage}`)
      return h('main', { className: 'adf' },
        h('div', { className: 'adf__inner' },
          h('header', { className: 'adf__header' },
            h('div', null,
              h('h1', { className: 'adf__title' }, t('pageTitle')),
              h('p', { className: 'adf__subtitle' }, t('subtitle'))
            ),
            h('span', { className: 'adf__pill' }, summary ? `${summary.total} 条 · ${summary.bugs} 个缺陷 · ${summary.requirements} 个需求` : 'PingCode')
          ),
          h('p', { className: 'adf__notice', role: 'status' }, t('localNotice')),
          persistenceError && h('p', { className: 'adf__notice adf__error', role: 'alert' }, t('storageError')),
          h('section', { className: 'adf__panel adf__pingcode' },
            h('div', { className: 'adf__panel-title adf__panel-title--spread' },
              h('strong', null, t('pingcodeTitle')),
              h('button', { className: 'adf__button', onClick: refreshPingCode, disabled: loading }, t('refresh'))
            ),
            h('div', { className: 'adf__toolbar adf__toolbar--filters' },
              h('select', { className: 'adf__select', value: repoId, onChange: event => setRepoId(event.target.value), 'aria-label': t('chooseRepo') },
                h('option', { value: '' }, t('chooseRepo')),
                ...repos.map(repo => h('option', { value: repo.id, key: repo.id, title: repo.path }, repo.displayName))
              ),
              h('input', { className: 'adf__input adf__search', value: search, onChange: event => { setSearch(event.target.value); setWorkItemPage(0) }, placeholder: t('search') }),
              h('select', { className: 'adf__select', value: workItemTypeFilter, onChange: event => { setWorkItemTypeFilter(event.target.value); setWorkItemPage(0) }, 'aria-label': '按类型筛选' },
                h('option', { value: '' }, '全部类型'),
                ...workItemTypes.map(type => h('option', { value: type, key: type }, type))
              ),
              h('select', { className: 'adf__select', value: workItemStateFilter, onChange: event => { setWorkItemStateFilter(event.target.value); setWorkItemPage(0) }, 'aria-label': '按状态筛选' },
                h('option', { value: '' }, '全部状态'),
                ...workItemStates.map(state => h('option', { value: state, key: state }, state))
              )
            ),
            h('div', { className: 'adf__toolbar adf__toolbar--selection' },
              h('input', { className: 'adf__input adf__search', value: manualIds, onChange: event => setManualIds(event.target.value), placeholder: t('addIds') }),
              h('button', { className: 'adf__button', onClick: addIdsToSelection, disabled: !manualIds.trim() }, t('addSelection')),
              h('span', { className: 'adf__selection-count' }, `已选 ${selectedWorkItemIds.length} 项`),
              h('button', { className: 'adf__button adf__button--primary', onClick: handoffSelected, disabled: starting || selectedWorkItemIds.length === 0 },
                starting ? t('starting') : `${t('handoff')}（${selectedWorkItemIds.length}）`)
            ),
            h('details', { className: 'adf__startup-instructions' },
              h('summary', { className: 'adf__startup-summary' }, t('startupInstructions'), h('span', null, '可选 · 展开填写')),
              h('label', { className: 'adf__field' },
                h('textarea', {
                  className: 'adf__textarea', value: creationInstructions, maxLength: 4000, rows: 2,
                  onChange: event => setCreationInstructions(event.target.value), placeholder: t('startupPlaceholder')
                })
              )
            ),
            error && h('p', { className: 'adf__notice adf__error' }, `${t('actionError')}：${error}`),
            loading ? h('div', { className: 'adf__empty' }, t('pingcodeLoading')) :
              workItems.length === 0 ? h('div', { className: 'adf__empty' }, t('pingcodeEmpty')) :
                h(React.Fragment, null,
                  h('div', { className: 'adf__panel-title adf__list-heading' },
                    h('strong', null, '待办列表'),
                    h('small', null, `当前筛选：${workItemTypeFilter || '全部类型'} · ${workItemStateFilter || '全部状态'} · 共 ${filteredWorkItems.length} 条`)
                  ),
                  filteredWorkItems.length === 0 ? h('div', { className: 'adf__empty' },
                    h('div', null, '没有符合条件的 PingCode 待办。'),
                    h('button', { className: 'adf__button', onClick: () => { setSearch(''); setWorkItemTypeFilter(''); setWorkItemStateFilter(''); setWorkItemPage(0) } }, '清除筛选')
                  ) : h(React.Fragment, null,
                    h('div', { className: 'adf__table-wrap' },
                      h('table', { className: 'adf__table adf__pingcode-table' },
                        h('thead', null, h('tr', null,
                          h('th', null, h('input', {
                            type: 'checkbox', checked: visibleWorkItems.length > 0 && selectedVisibleWorkItemCount === visibleWorkItems.length,
                            ref: element => { if (element) element.indeterminate = selectedVisibleWorkItemCount > 0 && selectedVisibleWorkItemCount < visibleWorkItems.length },
                            onChange: event => setSelectedWorkItemIds(ids => event.target.checked
                              ? [...new Set([...ids, ...visibleWorkItemIds])]
                              : ids.filter(id => !visibleWorkItemIds.includes(id))),
                            'aria-label': '选择当前页全部工作项'
                          })),
                          ...['bugId', 'workTitle', 'typeName', 'stateName', 'action'].map(key => h('th', { key }, key === 'action' ? '操作' : t(key)))
                        )),
                        h('tbody', null, ...visibleWorkItems.map(item => h('tr', { key: item.id },
                          h('td', null, h('input', { type: 'checkbox', checked: selectedWorkItemIds.includes(item.id), onChange: event => setSelectedWorkItemIds(ids => event.target.checked ? [...new Set([...ids, item.id])] : ids.filter(id => id !== item.id)), 'aria-label': `选择 ${item.identifier}` })),
                          h('td', { className: 'adf__id' }, externalLink(item.htmlUrl, item.identifier || '—')),
                          h('td', { title: item.title || '' }, item.title || '—'), h('td', null, item.typeName || '—'), h('td', null, item.state?.name || '—'),
                          h('td', null, h('button', { className: 'adf__button', onClick: () => showWorkItemDetails(item) }, t('viewDetails')))
                        )))
                      )
                    ),
                    h('nav', { className: 'adf__pagination', 'aria-label': 'PingCode 待办分页' },
                      h('div', { className: 'adf__pagination-size' },
                        h('span', null, '每页'),
                        h('select', { className: 'adf__select', value: workItemPageSize, onChange: event => { setWorkItemPageSize(Number(event.target.value)); setWorkItemPage(0) }, 'aria-label': '每页显示数量' },
                          ...[5, 10, 20, 50].map(size => h('option', { value: size, key: size }, `${size} 条`))
                        ),
                        h('span', null, `共 ${filteredWorkItems.length} 条`)
                      ),
                      h('div', { className: 'adf__pagination-pages' },
                        h('button', { className: 'adf__button', disabled: currentWorkItemPage === 0, onClick: () => setWorkItemPage(currentWorkItemPage - 1) }, '上一页'),
                        ...pageNumbers.flatMap((page, index) => [
                          ...(index > 0 && page - pageNumbers[index - 1] > 1 ? [h('span', { className: 'adf__pagination-ellipsis', key: `ellipsis-${page}` }, '…')] : []),
                          h('button', {
                            className: `adf__button${page === currentWorkItemPage ? ' adf__button--primary' : ''}`,
                            key: page, 'aria-current': page === currentWorkItemPage ? 'page' : undefined,
                            onClick: () => setWorkItemPage(page)
                          }, String(page + 1))
                        ]),
                        h('button', { className: 'adf__button', disabled: currentWorkItemPage >= pageCount - 1, onClick: () => setWorkItemPage(currentWorkItemPage + 1) }, '下一页')
                      )
                    )
                  )
                )
          ),
          h('div', { className: 'adf__layout' },
            h('section', { className: 'adf__panel' },
              h('div', { className: 'adf__panel-title adf__panel-title--spread' },
                h('div', { className: 'adf__list-heading' }, h('strong', null, t('flows')), h('small', null, '查看阶段与执行进度')),
                h('select', { className: 'adf__select', value: flowStatusFilter, onChange: event => setFlowStatusFilter(event.target.value), 'aria-label': '按开发流程状态筛选' },
                  h('option', { value: '' }, '全部状态'),
                  h('option', { value: 'active' }, t('active')),
                  h('option', { value: 'paused' }, t('paused')),
                  h('option', { value: 'completed' }, t('completed'))
                )
              ),
              visibleFlows.length === 0 ? h('div', { className: 'adf__empty' }, '没有符合状态的开发流程。') :
                h('div', { className: 'adf__table-wrap' },
                  h('table', { className: 'adf__table adf__flow-table' },
                    h('thead', null, h('tr', null,
                      ...['bugId', 'workTitle', 'repository', 'currentStage', 'status', 'updated'].map(key => h('th', { key }, t(key))),
                      h('th', { key: 'details' })
                    )),
                    h('tbody', null, ...visibleFlows.map(item => h('tr', {
                      key: item.id, className: `adf__row${selected?.id === item.id ? ' adf__row--selected' : ''}`,
                      onClick: () => setSelectedId(item.id)
                    },
                      h('td', { className: 'adf__id' }, externalLink(item.pingcodeUrl, item.bugId || '—', event => event.stopPropagation())),
                      h('td', { title: item.title || '' }, item.title || '—'),
                      h('td', { title: item.repository || '' }, item.repository || '—'),
                      h('td', null, stageLabel(item.stage)),
                      h('td', null, h('span', { className: 'adf__pill' }, item.paused ? t('paused') : t(item.status === 'completed' ? 'completed' : 'active'))),
                      h('td', { title: timeLabel(item.updatedAt, currentLocale) }, timeLabel(item.updatedAt, currentLocale, true)),
                      h('td', { className: 'adf__expand-cell' }, h('button', {
                        className: 'adf__button adf__flow-action', onClick: event => { event.stopPropagation(); setSelectedId(item.id) },
                        'aria-expanded': selected?.id === item.id,
                        'aria-controls': selected?.id === item.id ? 'adf-flow-drawer' : undefined,
                        'aria-label': `查看 ${item.bugId} 流程`
                      }, '查看流程'))
                    )))
                  )
                )
            )
          ),
          selected && h('div', { className: 'adf__flow-backdrop', onClick: () => setSelectedId(null) },
            h('section', {
              id: 'adf-flow-drawer', className: 'adf__flow-drawer', role: 'dialog', 'aria-modal': true,
              'aria-labelledby': 'adf-flow-drawer-title', onClick: event => event.stopPropagation()
            },
              h('header', { className: 'adf__flow-drawer-head' },
                h('h2', { id: 'adf-flow-drawer-title' }, `${selected.bugId} · ${t('details')}`),
                h('button', {
                  className: 'adf__button', onClick: () => orcaRefreshRef.current?.(true),
                  disabled: orcaRefreshing || !selected.worktree, 'aria-live': 'polite',
                  title: 'Orca 状态每 8 秒自动同步，也可手动刷新'
                }, orcaRefreshing ? '刷新中…' : '刷新状态'),
                h('button', {
                  className: 'adf__button adf__flow-drawer-close', onClick: () => setSelectedId(null),
                  'aria-label': '关闭流程详情', title: '关闭', autoFocus: true
                }, '×')
              ),
              h('div', { className: 'adf__flow-drawer-body' },
                h('div', { className: 'adf__details' },
                  h('div', { className: 'adf__detail-head' },
                    h('div', null, h('div', { className: 'adf__label' }, selected.title)),
                    h('span', { className: 'adf__pill' }, selected.paused ? t('paused') : t(selected.status === 'completed' ? 'completed' : 'active'))
                  ),
                  h('label', { className: 'adf__field', style: { marginTop: '11px' } },
                    h('span', { className: 'adf__label' }, t('currentStage')),
                    h('select', {
                      className: 'adf__select', value: selected.stage || 'intake', disabled: progressSaving || !repoIdFor(selected) || !selected.worktree,
                      onChange: event => changeStage(selected, event.target.value)
                    }, ...stages.map(stage => h('option', { value: stage, key: stage }, stageLabel(stage)))
                    )
                  ),
                  orcaLastRefreshedAt ? h('div', { className: 'adf__label', role: 'status' }, `Orca 状态最近同步：${timeLabel(orcaLastRefreshedAt, currentLocale)}`) : null,
                  orcaStateError ? h('div', { className: 'adf__notice adf__error', role: 'alert' }, `刷新 Orca 状态失败：${orcaStateError}`) : null,
                  h('div', { className: 'adf__actions' },
                    h('button', {
                      className: `adf__button${selected.paused ? ' adf__button--primary' : ''}`,
                      onClick: () => updateItem(selected.id, { paused: !selected.paused }, selected.paused ? t('resumedNote') : t('pausedNote'))
                    }, selected.paused ? t('resume') : t('pause')),
                    h('button', { className: 'adf__button adf__button--danger', onClick: cleanupSelected, disabled: cleaning || cleanupAlreadyRequested(selected) },
                      cleaning ? '正在启动清理…' : cleanupAlreadyRequested(selected) ? '清理已提交' : t('cleanup')),
                    h('button', { className: 'adf__button adf__button--danger', onClick: deleteSelectedFlow, disabled: deletingFlowId === selected.id },
                      deletingFlowId === selected.id ? '删除中…' : t('deleteFlow')),
                    selected.gitlabMrUrl && externalLink(selected.gitlabMrUrl, t('openMr'))
                  ),
                  h('section', { className: 'adf__notes' },
                    h('h3', { className: 'adf__notes-title' }, t('notes')),
                    (selected.notes || []).length === 0 ? h('div', { className: 'adf__label' }, t('noNotes')) :
                      h('ul', { className: 'adf__note-list' }, ...(selected.notes || []).map((note, index) => h('li', { className: 'adf__note', key: `${note.at}-${index}` },
                        h('time', { dateTime: note.at }, timeLabel(note.at, currentLocale)), note.text
                      ))),
                    h('div', { className: 'adf__note-compose' },
                      h('textarea', { className: 'adf__textarea', value: noteDraft, onChange: event => setNoteDraft(event.target.value), placeholder: t('notePlaceholder') }),
                      h('button', { className: 'adf__button', onClick: addNote, disabled: !noteDraft.trim() }, t('addNote'))
                    )
                  ),
                  h('section', { className: 'adf__notes' },
                    h('h3', { className: 'adf__notes-title' }, 'Orca 续办指令'),
                    h('div', { className: 'adf__label' }, '验证失败时可要求回原开发 Agent 修复并定向复测；也可明确终止/跳过验证并指定下一阶段。跳过会记录为“未验证”。'),
                    h('div', { className: 'adf__note-compose' },
                      h('textarea', {
                        className: 'adf__textarea', value: continueDraft,
                        onChange: event => setContinueDraft(event.target.value),
                        placeholder: '例如：返修清单交回原开发 Agent，修复后由 Grok 定向复测；或跳过剩余验证，标记未验证并继续 Review。'
                      }),
                      h('button', {
                        className: 'adf__button', onClick: () => continueInOrca(selected),
                        disabled: continuing || !continueDraft.trim() || !repoIdFor(selected) || !selected.worktree
                      }, continuing ? '发送中…' : '发送到 Orca')
                    )
                  ),
                  h('section', { className: 'adf__notes', 'aria-label': '中断当前执行' },
                    h('h3', { className: 'adf__notes-title' }, '中断当前执行并继续'),
                    h('div', { className: 'adf__label' }, '用于测试过慢或卡住：关闭所选 Worker 终端，并让 Orca 记录本次验证未完成后继续。'),
                    error?.startsWith('中断 Worker 失败') ? h('div', { className: 'adf__notice adf__error', role: 'alert' }, error) : null,
                    h('textarea', {
                      className: 'adf__textarea', value: interruptReason, maxLength: 1000,
                      onChange: event => setInterruptReason(event.target.value),
                      placeholder: '写明要中断的测试及原因，例如：某测试死循环，跳过本次验证并继续后续阶段'
                    }),
                    (orcaState?.activeWorkers || []).length ? h('div', { className: 'adf__actions' },
                      ...(orcaState.activeWorkers.map(worker => h('button', {
                        className: 'adf__button', key: worker.dispatchId,
                        onClick: () => interruptWorker(selected, worker),
                        disabled: Boolean(interruptingDispatchId) || !interruptReason.trim()
                      }, interruptingDispatchId === worker.dispatchId ? '中断中…' : `中断 ${worker.taskTitle} 并继续`)))
                    ) : h('div', { className: 'adf__label' }, '当前没有可中断的执行 Worker。')
                  ),
                  flowQuestionsAndReview(selected),
                  h('details', { className: 'adf__metadata' },
                    h('summary', { className: 'adf__metadata-summary' }, t('runtimeInfo')),
                    h('div', { className: 'adf__field-grid' },
                      field(t('bugId'), 'bugId'), field(t('workTitle'), 'title'), field(t('repository'), 'repository'),
                      field(t('pingcodeUrl'), 'pingcodeUrl', true, true), field(t('gitlabMrUrl'), 'gitlabMrUrl', true, true), field(t('branch'), 'branch', true),
                      field(t('runId'), 'runId'), field(t('taskId'), 'taskId'), field(t('dispatchId'), 'dispatchId'),
                      field(t('worktree'), 'worktree'), field(t('agent'), 'agent'), field(t('agentRole'), 'agentRole')
                    )
                  )
                )
              )
            )
          ),
          (detailLoading || detailError || workItemDetail) && h('div', { className: 'adf__modal-backdrop', onClick: () => { if (!detailLoading) { setWorkItemDetail(null); setDetailError('') } } },
            h('section', { className: 'adf__modal', role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'adf-pingcode-detail-title', onClick: event => event.stopPropagation() },
              h('header', { className: 'adf__modal-head' },
                h('h2', { id: 'adf-pingcode-detail-title' }, workItemDetail ? `${workItemDetail.identifier || ''} ${workItemDetail.title || ''}` : t('itemDetails')),
                h('button', { className: 'adf__button', onClick: () => { setWorkItemDetail(null); setDetailError('') }, disabled: detailLoading }, t('close'))
              ),
              detailLoading ? h('div', { className: 'adf__empty' }, t('detailLoading')) : detailError ? h('div', { className: 'adf__empty adf__error', role: 'alert' }, detailError) :
                h('div', { className: 'adf__modal-body' },
                  workItemDetailField('编号', workItemDetail.identifier), workItemDetailField('类型', workItemDetail.type),
                  workItemDetailField('状态', workItemDetail.state), workItemDetailField('优先级', workItemDetail.priority),
                  workItemDetailField('项目', workItemDetail.project), workItemDetailField('负责人', workItemDetail.assignee),
                  workItemDetailField('迭代', workItemDetail.sprint), workItemDetailField('标签', workItemDetail.tags),
                  workItemDetailField('描述', workItemDetail.description, true)
                )
            )
          )
        )
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const locale = ctx.get('locale')
        const zh = {
          nav: '自动化开发', pageTitle: 'Auto Dev Flow', subtitle: 'PingCode Bug 全生命周期跟踪',
          localNotice: '看板记录保存在当前 Harness 浏览器。本地 PingCode/GitLab/Orca 数据连接未启用；手工填写的关联信息不会自动同步。',
          storageError: '浏览器本地保存失败，本次修改可能不会保留。', newFlow: '新建流程', cancel: '取消', createHeading: '登记 PingCode Bug',
          bugId: 'Bug ID', workTitle: '标题', repository: '仓库', pingcodeUrl: 'PingCode 链接', gitlabMrUrl: 'GitLab MR 链接',
          currentStage: '当前阶段', status: '状态', updated: '最后更新', flows: 'Bug 流程', details: '流程详情', empty: '暂无流程。新建一条以开始跟踪。',
          selectHint: '选择一条 Bug 流程查看详情。', create: '创建流程', active: '进行中', paused: '已暂停', completed: '已完成',
          runId: 'Harness/Orca Run ID', taskId: 'Orca Task ID', dispatchId: 'Orca Dispatch ID', worktree: '工作区 / Worktree', agent: 'Agent', agentRole: 'Agent 职责', pause: '暂停', resume: '恢复',
          openMr: '打开 GitLab MR', notes: '时间线备注', noNotes: '还没有备注。', notePlaceholder: '记录进展或交接信息…', addNote: '添加备注',
          deleteFlow: '删除流程记录', deleteFlowConfirm: bugId => `仅从本机流程列表删除 ${bugId} 及其备注；不会删除 PingCode 工作项或 Orca 资源。是否继续？`,
          createdNote: '创建流程', pausedNote: '已暂停流程', resumedNote: '已恢复流程', stageChanged: '阶段变更',
          stage_intake: '需求接收', stage_requirements: '需求分析', stage_reproduction: '复现', stage_reproSkipped: '跳过复现',
          stage_implementation: '实现', stage_tests: '测试', stage_mrPreparation: '提交 MR', stage_mrReview: 'MR 评审', stage_acceptance: '验收', stage_archive: '归档'
        }
        const en = {
          nav: 'Automation Tasks', pageTitle: 'Auto Dev Flow', subtitle: 'Full lifecycle tracking for PingCode Bugs',
          localNotice: 'Dashboard records are stored in this Harness browser. PingCode/GitLab/Orca data connections are not enabled; manual references are not synced.',
          storageError: 'Browser storage failed; this change may not persist.', newFlow: 'New flow', cancel: 'Cancel', createHeading: 'Register PingCode Bug',
          bugId: 'Bug ID', workTitle: 'Title', repository: 'Repository', pingcodeUrl: 'PingCode URL', gitlabMrUrl: 'GitLab MR URL',
          currentStage: 'Current stage', status: 'Status', updated: 'Last updated', flows: 'Bug flows', details: 'Flow details', empty: 'No flows yet. Create one to start tracking.',
          selectHint: 'Select a Bug flow to view details.', create: 'Create flow', active: 'Active', paused: 'Paused', completed: 'Completed',
          runId: 'Harness/Orca Run ID', taskId: 'Orca Task ID', dispatchId: 'Orca Dispatch ID', worktree: 'Worktree', agent: 'Agent', agentRole: 'Agent role', pause: 'Pause', resume: 'Resume',
          openMr: 'Open GitLab MR', notes: 'Timestamped notes', noNotes: 'No notes yet.', notePlaceholder: 'Record progress or handoff details…', addNote: 'Add note',
          deleteFlow: 'Delete flow record', deleteFlowConfirm: bugId => `Remove only the local flow record for ${bugId} and its notes. The PingCode item and Orca resources will remain. Continue?`,
          createdNote: 'Flow created', pausedNote: 'Flow paused', resumedNote: 'Flow resumed', stageChanged: 'Stage changed',
          stage_intake: 'Intake', stage_requirements: 'Requirements', stage_reproduction: 'Reproduction', stage_reproSkipped: 'Reproduction skipped',
          stage_implementation: 'Implementation', stage_tests: 'Tests', stage_mrPreparation: 'Submit MR', stage_mrReview: 'MR review', stage_acceptance: 'Acceptance', stage_archive: 'Archive'
        }
        const dzh = locale?.register('@local/auto-dev-flow', 'zh-CN', zh)
        const den = locale?.register('@local/auto-dev-flow', 'en', en)
        ctx.effect(() => { dzh?.(); den?.() }, 'Auto Dev Flow locale dictionaries')
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.autoDevFlow = 'styles'
          style.textContent = cssText
          document.head.appendChild(style)
          return () => style.remove()
        }, 'Auto Dev Flow styles')
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: 'automation-tasks', order: 20,
          label: () => '自动化开发'
        }, Icon))
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: 'automation-tasks'
        }, props => h(Dashboard, { ...props, ctx })))
      }
    }
  }
})
