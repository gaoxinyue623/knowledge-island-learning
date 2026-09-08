# 知识岛｜课程来源策略

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 6 |
| 状态 | 来源类型、引用字段、人工核验边界已定义；真实来源尚未录入 |
| 类型入口 | `src/types/curriculum-verification.ts` 的 `SourceReference` |
| 现状 | Golden Sample 仅使用手工待补来源，不代表正式教材来源 |

## 1. 来源类型

`CurriculumSourceType` 支持：

| 类型 | 用途 | 能否单独产生 REVIEWED |
| --- | --- | --- |
| `official_platform` | 官方课程或教材平台 | 不能自动产生；仍需责任人审核范围和授权 |
| `publisher` | 出版社提供的教材或目录资料 | 不能自动产生；需核对版本和许可 |
| `curriculum_standard` | 课程标准、官方教学要求 | 只能证明标准范围，不能替代教材目录或正文 |
| `official_document` | 其他官方文件 | 需确认与当前教材事实的对应关系 |
| `manual` | 人工录入、教研核对或待补记录 | 只有完成证据核对和人工审核后才可进入 REVIEWED |
| `licensed` | 已授权的第三方资料 | 必须保存许可范围、期限和署名要求 |

AI 生成、模型记忆或“AI 知道”不是教材事实来源，也不能单独让实体进入 `VERIFIED` 或 `REVIEWED`。

## 2. SourceReference 最小记录

来源记录至少有 `id`、`type`、`title`；可选保存 URL、出版社、版次年份、课程标准版本、ISBN、页码、章节、获取时间、核验时间、核验人和备注。实体使用 `sourceReferenceIds` 引用来源；来源对象不在教材、单元、课次或知识点中重复嵌入。

来源记录只说明“依据是什么”，不自动证明地区教材适用性。`RegionTextbookRelation` 必须拥有自己的来源和核验状态；教材版本已核验不能替代地区映射核验。

## 3. 生产准入

进入 `REVIEWED` 前需完成：

1. 教材身份、学科、年级、学期、出版社和版次信息核对。
2. 单元、课次、知识点和关系与可靠资料逐项核对。
3. 教材正文、图片、音频、动画、视频和 SVG 的来源与版权确认。
4. 地区教材关系的来源、有效期、`DEFAULT / SUPPORTED / OPTIONAL` 含义和责任人确认。
5. `MANUAL_REVIEW` 审核记录、时间和证据留存。

当前 Golden Sample 的来源标题明确为“待补充（非正式教材来源）”，所以报告结果只能是 `REQUIRES_MANUAL_REVIEW`。

