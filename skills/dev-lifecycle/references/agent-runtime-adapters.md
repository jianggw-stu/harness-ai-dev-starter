# 可选 Agent Runtime 适配

只有任务明确使用多 Agent Runtime 时才阅读。本文件不规定 ORCA、A2A 等 Runtime 的技术选型；默认由独立 Codex 子 Worker 做需求分析，代码编写使用 `grok-4.7`（推理强度 medium），独立验证默认使用 Codex `gpt-6-luna`。用户本轮更具体指示优先。

## 与 Runtime 无关的边界

- 编排器/Runtime 负责任务状态、依赖及其配置的审批 Gate。
- Agent 执行限定能力并返回发现/证据；文档或交接内容不会自动获得改变权限的效力。
- A2A 是可选通信适配，不是共享文件系统或长期记忆库。可用时优先传递稳定的产物引用和版本，而非大段内容。
- 若所选 Runtime 没有直接集成，只能使用用户授权且实际可用的适配方式。没有可观察证据时，不声称已启动 Agent 或窗口。

## 用户选择的工具

需求分析默认由独立 Codex 子 Worker 执行；Harness 发起时由 Orca 绑定 Run/worktree 并提供问题、结论展示和用户确认；需求 Codex Worker 固定使用 `gpt-6-luna`、high 推理强度，避免继承 Sol/Astra 默认模型。用户明确指定其他 Agent 或窗口时遵从；Codex 不可用时说明并等待用户决定，不静默替换执行者。

## 角色边界与终端复用

- **Codex 子 Worker 只做业务需求分析。** 它只读取用户提供的需求/业务资料，只输出业务目标、角色、流程、业务规则、用户可见行为、验收标准和待确认问题；不得查代码、数据库/Schema、接口、架构、配置或技术资料，不得给技术方案或修改代码。技术未知项只列为待技术分析。
- Harness 流程中，需求 Worker 使用 Orca 阻塞式 `ask` 将业务问题送入当前 Run 的 coordinator mailbox；Harness 读取并显示待确认问题，用户逐题答复后由 Harness 通过 `orca orchestration reply` 回传给原问题。coordinator 不改写、不代答。Worker 收齐答复后回传 `worker_done` 和评审页；Harness 展示结论并等待用户明确点击“确认需求并继续”，收到确认前不得启动下一阶段。
- **技术内容由 Codex 或 Grok 负责。** 实现默认 Grok `grok-4.7`，之后由 Codex `gpt-6-luna` 独立验证并执行聚焦测试；若实现使用 Codex Luna（包括 high 推理强度），则由 Grok 验证。只允许 Grok/Luna 配对，不使用 Sol/Astra；派发后核验实际模型与 `launch.effective`，模型不匹配时停止并记为未验证。
- **优先复用已打开的 Orca 终端。** 查看终端清单后，先读取候选终端近期输出，确认 Agent 身份/职责、工作区路径和当前空闲状态。相同项目中符合这些条件的终端，直接复用于该角色的后续阶段；不要因为需求分析、开发、测试阶段切换就新建窗口或对话。只有无可复用终端、需隔离工作区，或用户明确要求时才创建新终端。不可把不同角色的终端互相复用，也不可将进行中的终端视作空闲。
- **角色/模型名不是可执行命令。** 通过 Orca 派发需求 Worker 时使用 `worker-start --agent codex --model gpt-6-luna --effort high`；派发后核对实际 Agent、模型与 `launch.effective`，不符时停止并报告。若用户指定其他 Agent/模型，先按其要求核对可用性。
- 新建角色终端时，只启动当前获授权阶段所需的 Agent。Codex 需求分析应只读业务资料，不得编辑仓库。全权限运行配置只适用于用户明确授权的实现工作，不能扩大任务授权范围。
- 派发前确认 CLI 已进入可接收输入的状态；派发后检查终端输出和 Orca Task/Dispatch 状态。只有 CLI 实际启动且 Orca 接受 Dispatch 后，才能报告该 Agent 已开始工作。若 CLI、模型或认证不可用，记录具体错误并按用户授权范围处理，不得悄悄改用 Gemini CLI 或其他 Agent。

## 可选 ORCA 用法

当当前流程选择 Orca（包括由 Harness 发起的自动化开发流程）且 CLI 可用时：

1. 创建新 Run 前检查 Runtime 状态和是否已有对应项目/任务上下文。
2. 创建范围清晰的 Task，说明阶段、能力、输入、预期输出和允许动作。
3. 只派发给已注册且可用的 Worker；使用 Runtime 生命周期机制，不把普通聊天伪称为派发。
4. 主流程核验任务身份、结果状态和产物路径；需求问题与结论须由 Harness 展示，需求分析后等待 Harness 明确确认，再派发下一阶段。其他重大决策/副作用由负责阶段的子 Agent 通过已配置的用户确认渠道确认。
5. 同一工作区保持单一写入者；有价值时在实现后安排独立只读评审。

CLI 或 Runtime 不可用时，不要编造命令、句柄或任务 ID。只有用户授权回退时才直接继续。
