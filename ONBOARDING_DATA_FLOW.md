# 知识岛｜Onboarding 数据流

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 6（继承 PHASE 5 Mock Curriculum Pipeline） |
| 状态 | 最小流程和课程读取闸门已实现；正式角色、学习和课程服务未实现 |
| 入口 | `/onboarding` |
| 持久化 | `curriculumProfileRepository`，localStorage 载荷版本 `1` |

## 1. 首次配置

```text
WelcomeOnboarding
  ↓
RegionSelect
  ↓ selectedRegionId
GradeSelect
  ↓ selectedGradeId + selectedSemesterId（默认 UPPER，但显式保存）
resolveAvailableTextbooks
  ↓ 三科 TextbookResolution
TextbookConfirm
  ↓ 三科独立 textbookVersionId
CharacterSetup
  ↓ characterId（最小占位）
Home placeholder
```

地区页面只回答“在哪里学习”，年级页面只回答“几年级”，教材页面只展示 Service 返回的出版社和完整版本信息。页面不根据地区名称猜出版社，也不把一个教材 ID 代表三科。

## 2. Store 草稿与档案

`curriculumStore` 分开保存：

- `selectedRegionId`、`selectedGradeId`、`selectedSemesterId`：当前草稿上下文。
- `availableTextbooks`、`resolutionStatus`：最近一次解析结果。
- `selectedTextbooks.CHINESE / MATH / ENGLISH`：三科草稿选择。
- `curriculumProfile`：最近一次已保存的当前档案。
- `loading`、`error`：跨页面状态反馈。

选择地区或年级会清理可能失效的教材草稿；修改期间旧 `curriculumProfile` 保留，只有三科都确认后才保存新档案。保存结构为：

```json
{
  "schemaVersion": 1,
  "profile": {
    "studentId": "SAMPLE_STUDENT_01",
    "regionId": "SAMPLE_REGION_A",
    "gradeId": "SAMPLE_GRADE_3",
    "semesterId": "SAMPLE_SEMESTER_UPPER",
    "chineseTextbookVersionId": "SAMPLE_CHINESE_TEXTBOOK_G3_UPPER_A",
    "mathTextbookVersionId": "SAMPLE_MATH_TEXTBOOK_G3_UPPER_A",
    "englishTextbookVersionId": "SAMPLE_ENGLISH_TEXTBOOK_G3_UPPER_A"
  }
}
```

实际保存还包含 `confirmedAt` 和 `source`。载荷读取使用 Zod；JSON 损坏、schema 版本错误或字段不合法时会删除存储并回到 Onboarding。

## 3. 修改流程

```text
我的学习设置
  ├─ 修改地区 → RegionSelect → GradeSelect → Resolve → TextbookConfirm → Save
  ├─ 修改年级 → GradeSelect → Resolve → TextbookConfirm → Save
  └─ 更换某科 → TextbookVersionSelector → 只更新该学科 → Save
```

修改地区前显示课本可能变化的提示；修改年级重新查询三科但不删除历史学习；修改数学只写 `mathTextbookVersionId`，语文和英语保持不变。取消修改时旧档案仍生效。

## 4. 路由保护

需要当前档案的 `/home`、`/map/*`、`/lesson/*`、`/question/*`、`/result/*`、`/tasks`、`/wrong-book`、`/profile`、`/character`、`/achievements`、`/curriculum-settings` 会在没有有效档案时跳转 `/onboarding`。Onboarding 页面本身不参与该重定向，避免循环；已有档案访问 `/onboarding` 默认回到 `/home`，需要编辑时使用编辑上下文。

PHASE 6 仍只验证选课数据流和读取边界；Home 是配置读取占位页，不代表正式知识岛已经开放。
