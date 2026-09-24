# PHASE 20：恢复真实模型验收

## 目标

本阶段重新验证真实模型题目生成链路，覆盖 B（进位加法）与 G（错题变式），并核对 v4 Prompt 对照、4096 输出预算、5 题分块、修复流程、四档难度梯度和人工抽查样本绑定。

## 本阶段实现

- 默认生成器继续使用 v6；新增 v7 作为本阶段的实验版本，明确要求先选操作数、逐题计算，并逐条执行 `hardMathRules`、模板范围和变式边界。
- 评估请求在 4096 token 最低输出预算下运行；真实验收使用 `temperature=0`。对带 reasoning 的模型，验收命令显式使用 `--thinking=disabled`，避免推理内容挤占结构化 JSON 输出预算。
- 评估模板的上限与当前 difficulty profile 对齐，避免模型在 G 场景把 50 以上操作数带入 `maxLargestOperand=49` 的请求。
- 运行时继续保留严格 JSON Schema、独立答案/范围/知识点校验、最多两次内容修复和显式 Mock 回退；回退题不计入 REAL_LLM_ONLY。

## 证据

- v4 B/G 对照：`.data/llm-evaluations/real-llm-2026-09-23T01-24-06-281Z.json`。最终有效率 96.5%，可作历史对照，不能作为最终验收。
- v6 全场景五批与四档难度：`.data/llm-evaluations/real-llm-2026-09-23T01-59-38-686Z.json`。覆盖完整，真实模型最终有效率 95.25%，回退率 15%，状态 FAIL。
- v7 A/F 探测（thinking disabled）：`.data/llm-evaluations/real-llm-2026-09-23T02-33-23-413Z.json`。40 题最终有效率 100%，回退率 0%，未包含完整覆盖和难度梯度，不能单独作为 PASS。
- v7 B/G 五批：`.data/llm-evaluations/real-llm-2026-09-23T04-57-13-065Z.json`。B 最终有效率 96%、回退率 20%；G 最终有效率 85%、回退率 100%。失败集中在进位/借位和错题变式的操作数上限，状态 FAIL。

## 结论

thinking disabled 已解决本阶段最明显的 4096 截断和大部分超时问题，但真实模型仍会在边界算式、重复题和 G 变式范围上产生不稳定输出。当前验收保持 FAIL，不能把 Mock 回退或未完成人工抽查标记为通过。人工抽查文件由脚本生成，所有字段仍为 `PENDING`，需要真实审核者填写后执行 `npm run llm:review`。

人工审核必须绑定同一报告的模型、Provider、Prompt 版本和 40 道样本；不能自动代填。
