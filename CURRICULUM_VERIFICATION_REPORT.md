# 知识岛｜PHASE 6 课程验证报告

> 本报告由 `npm run curriculum:review` 生成。当前验证对象是三年级数学上册 PEP 的 Golden Sample Framework；它是待核验导入框架，不是真实教材数据，也不代表教材事实已获确认。

## 结果

| 项目 | 值 |
| --- | --- |
| textbookId | GOLDEN_MATH_PEP_G3_S1_TEXTBOOK |
| textbookIdentityKey | PRI-MAT-PEP-G3-S1-UNKNOWN |
| verificationStatus | UNVERIFIED |
| finalResult | REQUIRES_MANUAL_REVIEW |
| samplePollution | PASS |
| knowledgeDag | PASS |
| errors | 0 |
| warnings | 1 |
| infos | 0 |

## 完整性统计

| 实体 | 总数 | 有效数 |
| --- | ---: | ---: |
| textbook | 1 | 1 |
| units | 1 | 1 |
| lessons | 3 | 3 |
| knowledgePoints | 4 | 4 |
| lessonKnowledgePoints | 6 | 6 |
| knowledgeRelations | 3 | 3 |

## 问题与待人工审核项

| 严重级别 | 代码 | 位置 | 说明 |
| --- | --- | --- | --- |
| warning | MANUAL_REVIEW_REQUIRED | textbook.GOLDEN_MATH_PEP_G3_S1_TEXTBOOK.verificationStatus | 导入包当前为 UNVERIFIED，正式发布前必须完成人工审核并进入 REVIEWED。 |

正式进入 REVIEWED 前仍需补充可靠教材来源、准确书名/版次/年份/ISBN、目录与课次核验、知识点语义映射、来源版权和人工审核记录。
