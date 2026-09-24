# PHASE 24：隔离计划断点续答

## 范围

在 PHASE 23 会话恢复基础上保存当前题组的答题位置和数字草稿，并提供“保存并暂停”。数据仍只存在当前浏览器 `sessionStorage`，不成为学习证据或正式档案。

## 实现

- 检查点增加 `draft.index` 与按题目 ID 保存的答案草稿，恢复后回到原题和原输入。
- 检查点按数据集、学生、教材、场景和模式校验归属；场景切换不会把旧计划写入新场景。
- 保存只接受当前题组的题目 ID和 32 字符以内草稿，未知字段和越界题号会被丢弃。
- 增加“保存并暂停”，暂停后可以从恢复卡片继续；组件卸载也会尽力保存已填写内容。
- 检查点恢复前重新校验 SAMPLE 快照、题目 Schema、数学答案、任务关系和完成状态；Trace 诊断不会写入浏览器检查点，降低敏感调试信息残留。
- 恢复后的计划重新建立知识点名称映射，继续使用原计划的模式、任务数量和学习快照。

## 验证

```sh
npm run type-check
npm run lint
npx --yes --package=node@24.20.0 node node_modules/vitest/vitest.mjs run tests/adaptive-plan-checkpoint.test.ts tests/adaptive-plan-report-ui.test.ts
```

专项测试覆盖草稿恢复、暂停后继续、检查点归属、题目校验、损坏数据和存储失败。
