# 知识岛 Question Engine 数据协议

> 本文档定义统一题目引擎的类型契约与示例数据。TypeScript 片段是协议定义，不是页面实现；JSON 片段全部是演示样例，不代表真实教材内容。

## 文档状态

| 项目 | 内容 |
| --- | --- |
| 所属阶段 | PHASE 9.4：Question Engine / Assessment（继承 PHASE 2.1、PHASE 6～8） |
| 状态 | 题目协议、结构化内容、媒体引用、QuestionKnowledgePoint、SAMPLE Demo、QuestionRenderer、确定性判题和可恢复 Assessment 已实现并验证；真实教材题库仍未核验 |
| 上游事实源 | `PRODUCT.md`、`CURRICULUM.md`、`DATA_MODEL.md` |
| 下游消费者 | 后续题目编辑器、QuestionRenderer、练习服务、内容审核流程 |
| MVP 范围 | `speaking` 只定义接口，不进入 MVP 实现 |
| 示例状态 | 所有示例均为 `isSample: true`、`needsVerification: true`、`verificationStatus: SAMPLE` |

---

## 1. 协议原则

1. `QuestionKnowledgePoint` 是题目知识点关系的权威来源；一个题目可以有多个关系，但每个题目必须有且仅有一个 `PRIMARY`。旧 `Question.knowledgePointId` 仅为迁移兼容字段。
2. `gradeId`、`semesterId`、`subjectId` 和 `textbookVersionId` 可以作为查询快照，但不能覆盖权威关系。
3. 答案必须使用结构化 `QuestionAnswerRule`，禁止固定为 `answer: string`。
4. 题型由 `questionType` 区分，QuestionRenderer 根据类型和数据渲染。
5. 题干、选项、音频、图片、提示和解析都可以版本化；修改已发布题目必须创建新的 `ContentVersion`。
6. 所有题目必须有 `sourceId`、`status`、`needsVerification` 和 `contentType`。
7. 无法核验的内容保持未发布，不得因为示例字段齐全而进入学生端。

题干、选项、提示和解析统一由 `ContentBlock[]` 表达。文本、富文本、图片、音频和公式可以在同一内容序列中组合；图片、音频、视频、动画和 SVG 的真实资源事实统一存放在 `MediaAsset`，题目协议只保存 `mediaAssetId` 引用。

---

## 2. 共享类型定义

下面的共享定义是题目协议的基线。正式工程实现时可以拆分到类型文件，但字段语义应保持一致。

```ts
type Id = string;

type QuestionType =
  | "singleChoice"
  | "multipleChoice"
  | "fillBlank"
  | "trueFalse"
  | "dragDrop"
  | "matching"
  | "sorting"
  | "typing"
  | "listening"
  | "calculation"
  | "reading"
  | "sentenceOrdering"
  | "speaking"
  | "shortAnswer";

type Difficulty = "FOUNDATION" | "STANDARD" | "ADVANCED";

type ContentType = "TEXTBOOK" | "EXTENSION" | "REVIEW" | "CHALLENGE";

type ContentStatus =
  | "DRAFT"
  | "AI_GENERATED"
  | "REVIEWED"
  | "VERIFIED"
  | "PUBLISHED"
  | "ARCHIVED"
  | "REJECTED";

type ContentBlockType = "TEXT" | "RICH_TEXT" | "IMAGE" | "AUDIO" | "FORMULA";

interface ContentBlock {
  type: ContentBlockType;
  text?: string;
  mediaAssetId?: Id;
  altText?: string;
}

interface QuestionBase {
  id: Id;
  questionType: QuestionType;
  stem: ContentBlock[];
  // 旧数据兼容字段；新引擎必须读取 QuestionKnowledgePoint 关系
  knowledgePointId?: Id;
  difficulty: Difficulty;
  contentType: ContentType;
  sourceId: Id;
  status: ContentStatus;
  needsVerification: boolean;
  estimatedSeconds: number;
  tags: string[];
  media: QuestionMedia[];

  // 查询快照，不是主要课程关系事实源
  gradeId?: Id;
  semesterId?: Id;
  subjectId?: Id;
  textbookVersionId?: Id;
  snapshotAt?: string;
  snapshotSource?: string;
  questionVersion?: number;

  hints: QuestionHint[];
  explanation: QuestionExplanation;
  isSample: boolean;
  verificationStatus?: "SAMPLE" | "UNVERIFIED" | "VERIFIED" | "REVIEWED" | "REJECTED";
}

interface QuestionOption {
  id: Id;
  questionId: Id;
  optionKey: string;
  content: ContentBlock[];
  media?: QuestionMedia[];
  sortOrder: number;
}

interface QuestionMedia {
  mediaAssetId: Id;
  usageType: "STEM" | "OPTION" | "HINT" | "EXPLANATION" | "AUDIO_PROMPT" | "PASSAGE" | "REFERENCE";
  order: number;
}

interface QuestionHint {
  id: Id;
  order: number;
  trigger: "ON_REQUEST" | "AFTER_WRONG" | "AFTER_REPEATED_WRONG";
  content: ContentBlock[];
}

interface QuestionExplanation {
  summary: ContentBlock[];
  steps: ContentBlock[][];
  misconceptionTags?: string[];
}

interface QuestionKnowledgePoint {
  id: Id;
  questionId: Id;
  knowledgePointId: Id;
  relationType: "PRIMARY" | "SECONDARY";
  order: number;
  isPrimary: boolean;
  sourceId: Id;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  needsVerification: boolean;
  verificationStatus?: "SAMPLE" | "UNVERIFIED" | "VERIFIED" | "REVIEWED" | "REJECTED";
}

interface MediaAsset {
  id: Id;
  mediaType: "IMAGE" | "AUDIO" | "VIDEO" | "ANIMATION" | "SVG";
  storageKey: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  altText: string | null;
  transcript: string | null;
  sourceId: Id;
  copyrightStatus: "UNKNOWN" | "PENDING" | "CLEARED" | "RESTRICTED";
  license: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
  needsVerification: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SingleChoiceAnswerRule {
  ruleType: "SINGLE_OPTION";
  correctOptionKey: string;
}

interface MultipleChoiceAnswerRule {
  ruleType: "MULTIPLE_OPTIONS";
  correctOptionKeys: string[];
  selectionMode: "EXACT_SET";
}

interface FillBlankAnswerRule {
  ruleType: "TEXT_BLANKS";
  blanks: Array<{
    blankId: string;
    acceptedAnswers: string[];
    normalization?: "NONE" | "TRIM" | "CASE_INSENSITIVE" | "SIMPLIFIED_CHINESE";
  }>;
}

interface TrueFalseAnswerRule {
  ruleType: "BOOLEAN";
  correctValue: boolean;
}

interface DragDropAnswerRule {
  ruleType: "PLACEMENT";
  placements: Array<{ itemKey: string; targetKey: string }>;
}

interface MatchingAnswerRule {
  ruleType: "PAIRS";
  pairs: Array<{ leftKey: string; rightKey: string }>;
}

interface SortingAnswerRule {
  ruleType: "ORDERED_KEYS";
  orderedKeys: string[];
}

interface TypingAnswerRule {
  ruleType: "ACCEPTED_TEXT";
  acceptedAnswers: string[];
  normalization: "NONE" | "TRIM" | "CASE_INSENSITIVE" | "SIMPLIFIED_CHINESE";
}

interface ListeningAnswerRule {
  ruleType: "LISTENING_RESPONSE";
  acceptedOptionKeys?: string[];
  acceptedTexts?: string[];
  maxReplays?: number;
}

interface CalculationAnswerRule {
  ruleType: "NUMERIC";
  value: number | string;
  unit?: string;
  tolerance?: number;
}

interface ShortAnswerAnswerRule {
  ruleType: "MANUAL_REVIEW";
}

interface ReadingAnswerRule {
  ruleType: "READING_SUB_QUESTIONS";
  subQuestionIds: Id[];
}

interface SentenceOrderingAnswerRule {
  ruleType: "ORDERED_TOKENS";
  orderedTokenKeys: string[];
}

interface SpeakingAnswerRule {
  ruleType: "SPEAKING_RUBRIC";
  referenceAudioMediaAssetId?: Id;
  scoringMode: "MANUAL_REVIEW" | "FUTURE_SPEECH_API";
  rubric: string[];
}

type QuestionAnswerRule =
  | SingleChoiceAnswerRule
  | MultipleChoiceAnswerRule
  | FillBlankAnswerRule
  | TrueFalseAnswerRule
  | DragDropAnswerRule
  | MatchingAnswerRule
  | SortingAnswerRule
  | TypingAnswerRule
  | ListeningAnswerRule
  | CalculationAnswerRule
  | ShortAnswerAnswerRule
  | ReadingAnswerRule
  | SentenceOrderingAnswerRule
  | SpeakingAnswerRule;
```

`QuestionMedia` 只保存 `mediaAssetId`、`usageType` 和 `order`。`MediaAsset` 的真实 URL、存储键、尺寸、时长、文字稿、来源、版权和版本由 `DATA_MODEL.md` 定义的 `MediaAsset` 保存；题目协议不得在 `QuestionMedia` 中重复保存真实 URI。

---

## 3. 题型正式结构

### 3.1 singleChoice

单选题要求恰好一个正确选项。选项的顺序由 `QuestionOption.sortOrder` 控制，正确答案由 `correctOptionKey` 指向选项键。

```ts
interface SingleChoiceQuestion extends QuestionBase {
  questionType: "singleChoice";
  options: QuestionOption[];
  answerRule: SingleChoiceAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-single-choice",
  "questionType": "singleChoice",
  "stem": [{ "type": "TEXT", "text": "协议示例：请选择占位选项。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "FOUNDATION",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 20,
  "tags": ["sample"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "snapshotAt": "2026-09-02T00:00:00Z",
  "snapshotSource": "sample-snapshot",
  "hints": [],
  "explanation": {
    "summary": [{ "type": "TEXT", "text": "这是题型协议演示，不代表教材解析。" }],
    "steps": [[{ "type": "TEXT", "text": "示例步骤" }]]
  },
  "isSample": true,
  "options": [
    { "id": "sample-option-a", "questionId": "sample-question-single-choice", "optionKey": "A", "content": [{ "type": "TEXT", "text": "占位选项 A" }], "sortOrder": 1 },
    { "id": "sample-option-b", "questionId": "sample-question-single-choice", "optionKey": "B", "content": [{ "type": "TEXT", "text": "占位选项 B" }], "sortOrder": 2 }
  ],
  "answerRule": { "ruleType": "SINGLE_OPTION", "correctOptionKey": "A" }
}
```

### 3.2 multipleChoice

多选题要求学生选择完整的正确集合。MVP 默认使用 `EXACT_SET`，不因多选少选而使用未定义的部分分规则。

```ts
interface MultipleChoiceQuestion extends QuestionBase {
  questionType: "multipleChoice";
  options: QuestionOption[];
  answerRule: MultipleChoiceAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-multiple-choice",
  "questionType": "multipleChoice",
  "stem": [{ "type": "TEXT", "text": "协议示例：请选择所有占位选项。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 30,
  "tags": ["sample"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "options": [
    { "id": "sample-option-a", "questionId": "sample-question-multiple-choice", "optionKey": "A", "content": [{ "type": "TEXT", "text": "占位选项 A" }], "sortOrder": 1 },
    { "id": "sample-option-b", "questionId": "sample-question-multiple-choice", "optionKey": "B", "content": [{ "type": "TEXT", "text": "占位选项 B" }], "sortOrder": 2 },
    { "id": "sample-option-c", "questionId": "sample-question-multiple-choice", "optionKey": "C", "content": [{ "type": "TEXT", "text": "占位选项 C" }], "sortOrder": 3 }
  ],
  "answerRule": { "ruleType": "MULTIPLE_OPTIONS", "correctOptionKeys": ["A", "C"], "selectionMode": "EXACT_SET" }
}
```

### 3.3 fillBlank

填空题使用多个带唯一 `blankId` 的空位。每个空位可以有多个可接受答案，并明确规范化规则。

```ts
interface FillBlankQuestion extends QuestionBase {
  questionType: "fillBlank";
  blanks: Array<{ blankId: string; placeholder?: string }>;
  answerRule: FillBlankAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-fill-blank",
  "questionType": "fillBlank",
  "stem": [{ "type": "TEXT", "text": "协议示例：请填写占位内容。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "FOUNDATION",
  "contentType": "REVIEW",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 35,
  "tags": ["sample", "review"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "blanks": [{ "blankId": "blank-1", "placeholder": "请输入占位内容" }],
  "answerRule": {
    "ruleType": "TEXT_BLANKS",
    "blanks": [{ "blankId": "blank-1", "acceptedAnswers": ["示例答案"], "normalization": "TRIM" }]
  }
}
```

### 3.4 trueFalse

判断题用布尔规则表达答案，不用字符串比较“正确”或“错误”。

```ts
interface TrueFalseQuestion extends QuestionBase {
  questionType: "trueFalse";
  statement: string;
  answerRule: TrueFalseAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-true-false",
  "questionType": "trueFalse",
  "stem": [{ "type": "TEXT", "text": "协议示例：判断下面的占位陈述。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "FOUNDATION",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 15,
  "tags": ["sample"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "statement": "这是一条占位陈述。",
  "answerRule": { "ruleType": "BOOLEAN", "correctValue": true }
}
```

### 3.5 dragDrop

拖拽题区分可拖拽项与目标位置。答案规则保存每个 `itemKey` 与 `targetKey` 的配对，避免用数组位置隐式表达答案。

```ts
interface DragDropQuestion extends QuestionBase {
  questionType: "dragDrop";
  draggableItems: Array<{ itemKey: string; content: ContentBlock[] }>;
  targets: Array<{ targetKey: string; label: string }>;
  answerRule: DragDropAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-drag-drop",
  "questionType": "dragDrop",
  "stem": [{ "type": "TEXT", "text": "协议示例：把占位项拖到合适位置。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 40,
  "tags": ["sample", "interaction"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "draggableItems": [{ "itemKey": "item-1", "content": [{ "type": "TEXT", "text": "占位项" }] }],
  "targets": [{ "targetKey": "target-1", "label": "占位目标" }],
  "answerRule": { "ruleType": "PLACEMENT", "placements": [{ "itemKey": "item-1", "targetKey": "target-1" }] }
}
```

### 3.6 matching

匹配题使用左、右两组项目与配对规则。两侧的键必须稳定，不能用屏幕坐标保存答案。

```ts
interface MatchingQuestion extends QuestionBase {
  questionType: "matching";
  leftItems: Array<{ key: string; content: ContentBlock[] }>;
  rightItems: Array<{ key: string; content: ContentBlock[] }>;
  answerRule: MatchingAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-matching",
  "questionType": "matching",
  "stem": [{ "type": "TEXT", "text": "协议示例：连接对应的占位项目。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "EXTENSION",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 40,
  "tags": ["sample", "interaction"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "leftItems": [{ "key": "left-1", "content": [{ "type": "TEXT", "text": "左侧占位项" }] }],
  "rightItems": [{ "key": "right-1", "content": [{ "type": "TEXT", "text": "右侧占位项" }] }],
  "answerRule": { "ruleType": "PAIRS", "pairs": [{ "leftKey": "left-1", "rightKey": "right-1" }] }
}
```

### 3.7 sorting

排序题使用稳定的 `itemKey`，答案规则显式保存正确顺序。

```ts
interface SortingQuestion extends QuestionBase {
  questionType: "sorting";
  items: Array<{ itemKey: string; content: ContentBlock[] }>;
  answerRule: SortingAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-sorting",
  "questionType": "sorting",
  "stem": [{ "type": "TEXT", "text": "协议示例：将占位项目排序。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "REVIEW",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 45,
  "tags": ["sample", "sorting"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "items": [
    { "itemKey": "item-a", "content": [{ "type": "TEXT", "text": "占位项目 A" }] },
    { "itemKey": "item-b", "content": [{ "type": "TEXT", "text": "占位项目 B" }] }
  ],
  "answerRule": { "ruleType": "ORDERED_KEYS", "orderedKeys": ["item-b", "item-a"] }
}
```

### 3.8 typing

输入题保存可接受答案集合与规范化方式。中文、英文大小写、空格等规则必须由数据配置，不由组件猜测。

```ts
interface TypingQuestion extends QuestionBase {
  questionType: "typing";
  inputMode: "TEXT" | "PINYIN" | "ENGLISH";
  answerRule: TypingAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-typing",
  "questionType": "typing",
  "stem": [{ "type": "TEXT", "text": "协议示例：输入占位答案。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "FOUNDATION",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 35,
  "tags": ["sample", "typing"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "inputMode": "TEXT",
  "answerRule": { "ruleType": "ACCEPTED_TEXT", "acceptedAnswers": ["示例答案"], "normalization": "TRIM" }
}
```

### 3.9 listening

听力题必须引用音频媒体，并在可用时提供文字稿或替代路径。`maxReplays` 是体验配置，不应强制为零。

```ts
interface ListeningQuestion extends QuestionBase {
  questionType: "listening";
  prompt: string;
  audioMediaAssetId: Id;
  options?: QuestionOption[];
  answerRule: ListeningAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-listening",
  "questionType": "listening",
  "stem": [{ "type": "TEXT", "text": "协议示例：播放占位音频后作答。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 45,
  "tags": ["sample", "audio"],
  "media": [{ "mediaAssetId": "sample-audio-asset", "usageType": "AUDIO_PROMPT", "order": 1 }],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "prompt": "请选择你听到的占位内容。",
  "audioMediaAssetId": "sample-audio-asset",
  "options": [{ "id": "sample-option-a", "questionId": "sample-question-listening", "optionKey": "A", "content": [{ "type": "TEXT", "text": "占位选项" }], "sortOrder": 1 }],
  "answerRule": { "ruleType": "LISTENING_RESPONSE", "acceptedOptionKeys": ["A"], "maxReplays": 3 }
}
```

### 3.10 calculation

计算题的答案使用数值规则，可选单位与误差范围。表达式、变量和展示格式属于题目数据的一部分，不能只把答案拼成文本。

```ts
interface CalculationQuestion extends QuestionBase {
  questionType: "calculation";
  expression: string;
  answerFormat: "NUMBER" | "DECIMAL" | "FRACTION" | "UNIT_VALUE";
  answerRule: CalculationAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-calculation",
  "questionType": "calculation",
  "stem": [{ "type": "TEXT", "text": "协议示例：完成占位计算。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 30,
  "tags": ["sample", "calculation"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "expression": "SAMPLE_EXPRESSION",
  "answerFormat": "NUMBER",
  "answerRule": { "ruleType": "NUMERIC", "value": "SAMPLE_VALUE", "tolerance": 0 }
}
```

### 3.11 shortAnswer

简答题在 PHASE 9 只负责收集结构化文本并进入人工审核，不做 AI 自动评分。答案规则明确标记为 `MANUAL_REVIEW`，提交后锁定输入，结果为 `manual_review_required`，不计入自动评分分母。

```ts
interface ShortAnswerQuestion extends QuestionBase {
  questionType: "shortAnswer";
  answerRule: ShortAnswerAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "DEMO_QUESTION_SHORT_ANSWER",
  "questionType": "shortAnswer",
  "stem": [{ "type": "TEXT", "text": "请用一句话说说你的观察。" }],
  "sourceId": "QUESTION_DEMO_SOURCE",
  "status": "DRAFT",
  "needsVerification": true,
  "isSample": true,
  "answerRule": { "ruleType": "MANUAL_REVIEW" }
}
```

### 3.12 reading

阅读题把材料与子题分开。阅读材料本身必须有独立来源与审核状态，子题通过 `subQuestionIds` 或嵌入式协议引用它。

```ts
interface ReadingQuestion extends QuestionBase {
  questionType: "reading";
  passage: string;
  passageMedia?: QuestionMedia[];
  subQuestionIds: Id[];
  answerRule: ReadingAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-reading",
  "questionType": "reading",
  "stem": [{ "type": "TEXT", "text": "协议示例：阅读占位材料并完成子题。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "ADVANCED",
  "contentType": "EXTENSION",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 90,
  "tags": ["sample", "reading"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "passage": "这是仅用于协议演示的占位材料，不是教材正文。",
  "passageMedia": [],
  "subQuestionIds": ["sample-reading-sub-question-1"],
  "answerRule": { "ruleType": "READING_SUB_QUESTIONS", "subQuestionIds": ["sample-reading-sub-question-1"] }
}
```

### 3.13 sentenceOrdering

句子排序题使用带键的 token，答案为明确的 token 顺序。标点可以作为 token，也可以作为结构化展示规则，但不能依赖前端字符串拼接猜测。

```ts
interface SentenceOrderingQuestion extends QuestionBase {
  questionType: "sentenceOrdering";
  tokens: Array<{ tokenKey: string; text: string; sortOrder: number }>;
  answerRule: SentenceOrderingAnswerRule;
}
```

JSON 演示：

```json
{
  "id": "sample-question-sentence-ordering",
  "questionType": "sentenceOrdering",
  "stem": [{ "type": "TEXT", "text": "协议示例：将占位词语排列成正确顺序。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "REVIEW",
  "sourceId": "sample-source-unverified",
  "status": "AI_GENERATED",
  "needsVerification": true,
  "estimatedSeconds": 50,
  "tags": ["sample", "ordering"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "tokens": [
    { "tokenKey": "token-a", "text": "占位词 A", "sortOrder": 1 },
    { "tokenKey": "token-b", "text": "占位词 B", "sortOrder": 2 }
  ],
  "answerRule": { "ruleType": "ORDERED_TOKENS", "orderedTokenKeys": ["token-b", "token-a"] }
}
```

### 3.14 speaking（仅接口，暂不进入 MVP）

口语题只保留未来接口定义。MVP 不实现自动语音识别、自动评分或录音上传；如果进入后续阶段，必须另行完成隐私、监护人授权、音频保留和评分准确性设计。

```ts
interface SpeakingQuestion extends QuestionBase {
  questionType: "speaking";
  prompt: string;
  referenceAudioMediaAssetId?: Id;
  recordingPolicy: {
    allowRecording: boolean;
    maxDurationSeconds: number;
    retentionPolicy: "NONE" | "SESSION_ONLY" | "EXPLICITLY_CONSENTED";
  };
  answerRule: SpeakingAnswerRule;
  mvpIncluded: false;
}
```

JSON 协议演示（不代表 MVP 功能）：

```json
{
  "id": "sample-question-speaking",
  "questionType": "speaking",
  "stem": [{ "type": "TEXT", "text": "协议示例：朗读占位提示。" }],
  "knowledgePointId": "sample-knowledge-point",
  "difficulty": "STANDARD",
  "contentType": "CHALLENGE",
  "sourceId": "sample-source-unverified",
  "status": "DRAFT",
  "needsVerification": true,
  "estimatedSeconds": 60,
  "tags": ["sample", "speaking", "not-mvp"],
  "media": [],
  "gradeId": "sample-grade-3",
  "semesterId": "sample-upper",
  "subjectId": "sample-subject",
  "textbookVersionId": "sample-textbook-version",
  "hints": [],
  "explanation": { "summary": [{ "type": "TEXT", "text": "协议演示，当前不实现自动评分。" }], "steps": [[{ "type": "TEXT", "text": "示例步骤" }]] },
  "isSample": true,
  "prompt": "请朗读占位内容。",
  "recordingPolicy": { "allowRecording": false, "maxDurationSeconds": 30, "retentionPolicy": "NONE" },
  "answerRule": { "ruleType": "SPEAKING_RUBRIC", "scoringMode": "MANUAL_REVIEW", "rubric": ["清晰度（待定义）"] },
  "mvpIncluded": false
}
```

---

## 4. 题目校验规则

### 4.1 通用校验

- `id`、`questionType`、`stem`、`difficulty`、`contentType`、`sourceId`、`status` 和 `needsVerification` 必须存在；每个题目还必须有可解析的 `QuestionKnowledgePoint` 关系和唯一 `PRIMARY`。
- `estimatedSeconds` 必须是正数；过短或过长的值进入内容审核提示，不在渲染器中静默修正。
- 题型字段必须与 `questionType` 匹配，不能出现单选题携带排序答案规则的情况。
- 选择、匹配、拖拽和排序的答案键必须存在于当前题目的选项或项目中。
- 所有 `mediaAssetId` 引用必须存在并指向状态可用的 `MediaAsset`；缺少替代文字或音频文字稿时，审核记录必须说明原因。
- `ContentBlock` 的 `IMAGE`、`AUDIO` 类型必须通过 `mediaAssetId` 引用资源，题目、选项、提示和解析不得保存真实 URI。
- `contentType = TEXTBOOK` 时必须有教材范围和可靠来源；示例题不能以此方式伪装教材题。
- `status = PUBLISHED` 时不得有 `needsVerification = true`、缺少 `sourceId` 或未通过的版本审核记录。

### 4.2 题型完整性

| 题型 | 最小完整性要求 |
| --- | --- |
| `singleChoice` | 选项不少于 2 个，正确键恰好 1 个 |
| `multipleChoice` | 选项不少于 2 个，正确键集合非空 |
| `fillBlank` | 每个空位有唯一键和可接受答案 |
| `trueFalse` | `correctValue` 必须是布尔值 |
| `dragDrop` | 每个拖拽项和目标键唯一，答案覆盖要求项 |
| `matching` | 左右项目键唯一，配对双方存在 |
| `sorting` | 项目键唯一，答案包含每个必排序项目一次 |
| `typing` | 输入模式与规范化规则明确 |
| `listening` | 音频媒体存在，必要时有文字稿或替代路径 |
| `calculation` | 表达式、格式和数值规则同时存在 |
| `reading` | 阅读材料来源明确，子题引用可解析 |
| `sentenceOrdering` | token 键唯一，正确顺序完整 |
| `speaking` | 仅允许接口协议；MVP 中 `mvpIncluded` 必须为 `false` |

### 4.3 快照一致性

题目上的年级、学期、学科和教材版本是查询快照。快照校验流程：

1. 根据 `QuestionKnowledgePoint` 的 `PRIMARY` 关系和题目教材范围关系读取权威上下文；不能只读旧 `knowledgePointId`。
2. 生成或比较 `gradeId`、`semesterId`、`subjectId` 和 `textbookVersionId`。
3. 若快照不一致，标记内容待修复，不自动发布。
4. 版本切换不覆盖原题；复用题目时新增课程范围关系或内容版本。

---

## 5. 题目提交结果边界

题目协议只负责描述题目与答案规则；`QuestionSession`、`QuestionAttempt` 和 Assessment 结果属于学习行为域。后续工程不得把学生答案直接写回 Question：

- 学生作答保存在独立 `QuestionAttempt`，提交后保留 `questionVersion`。
- PHASE 9 的 Validator 只生成 `QuestionAttemptResult`；它不生成 `MasteryEvent`、`WrongQuestion` 或奖励。
- `shortAnswer` 只返回 `manual_review_required`，不进行 AI 自动评分。
- 未来若将作答结果映射为 `MasteryEvent`，必须由后续学习行为服务按事件规则完成，不能由 Question Engine 隐式触发。
- 重新编辑题目时，历史作答仍指向历史版本，不被新正文覆盖。

---

## 6. 待确认事项

1. `QuestionAnswerRule` 是否采用嵌入式 JSON，或拆成独立版本化实体。
2. 阅读材料是否单独建模为 `CourseContent` 并由题目引用。
3. 题目部分得分、容错和开放答案的评分策略。
4. 音频、图片、动画的媒体服务与授权来源。
5. `speaking` 进入 MVP 之外的隐私、授权、上传与评分方案。

上述问题不影响当前题型协议的结构化方向；正式题目工程实现前仍必须形成可执行的验证规则。

## 7. PHASE 5 Mock 校验实现

PHASE 5 在 `src/data/curriculum/questions/` 提供少量 `SAMPLE_*` 的 `singleChoice`、`dragDrop`、`calculation` 和 `reading` 夹具，全部带 `isSample: true`、`needsVerification: true`、`verificationStatus: SAMPLE`，状态为 `DRAFT`，不包含真实教材内容或答案事实。`validateQuestion` 会校验：

- `questionType` 与 `answerRule.ruleType` 是否匹配。
- `QuestionKnowledgePoint`、`sourceId` 和所有 `mediaAssetId` 是否可解析；旧 `knowledgePointId` 不得成为唯一关系。
- `stem`、选项、提示和解析是否使用合法 `ContentBlock[]`。
- 选择、拖拽、阅读子题等题型字段和引用是否完整。
- 示例记录是否违反 `status != PUBLISHED` 的发布闸门。

题目媒体只通过 `QuestionMedia.mediaAssetId` 引用 `MediaAsset`；真实答题、评分、掌握度事件和 QuestionRenderer 不在 PHASE 5 范围内。

## 8. PHASE 6 来源与发布边界

题目仍使用 `ContentBlock[]`，`QuestionOption.content`、`QuestionHint.content`、`QuestionExplanation.summary / steps` 和题目媒体都不收窄为 string 或真实 URI。题目事实的来源与核验可通过 `sourceReferenceIds` / `SourceReference` 追踪；`verificationStatus` 与题目 `status` 分开，`PUBLISHED` 是学生端发布状态，`REVIEWED` 只是事实核验状态。

`SAMPLE_*` 题目只能存在于明确的 SAMPLE 命名空间，不能进入 VERIFIED / REVIEWED 数据集。PHASE 6 没有实现 Question Engine、真实作答、评分、Mastery 或 KnowledgeEnergy 运行逻辑；这些边界由 PHASE 9 另行实现。

## 9. PHASE 7 使用边界

PHASE 7 的 LearningMap 只读取课程层的 `KnowledgePoint` 与关系来生成地图节点，不生成或填充 `Question`、`ContentBlock`、答案规则或题库。地图节点详情不展示题目正文和答案；题目协议继续由后续 LessonPlayer / Question Engine 消费，`ContentBlock[]` 与 `MediaAsset` 引用契约不得因地图实现而简化。

## 10. PHASE 8 使用边界

PHASE 8 的 LessonPlayer 只消费 `CourseContent` / `LearningContent` 的 `ContentBlock[]`，并将 `practice` 作为非评分内容占位；PHASE 9 通过独立入口接入 Assessment，不把题目事实或判题责任放回 LessonPlayer。

`QuestionBase.stem`、`QuestionOption.content`、`QuestionHint.content`、`QuestionExplanation.summary / steps` 和 `QuestionMedia` 继续保持本文件定义的结构化协议；题干与选项不收窄为 string，媒体不保存真实 URI。

## 11. PHASE 9 Question Engine 使用边界

PHASE 9 已实现六类题型的开发态 Assessment：`singleChoice`、`multipleChoice`、`trueFalse`、`fillBlank`、`calculation` 和 `shortAnswer`。`AssessmentDefinition.questionIds` 提供固定顺序，`QuestionEngineAdapter` 只读取有效的 `QuestionKnowledgePoint` 关系和集中审核闸门，不随机抽题、不进行自适应难度调整、不调用模型猜测教材或知识点。

`QuestionRenderer` 根据 `QuestionViewModel` 渲染结构化题干、选项、题目媒体、草稿、提交状态和解析。`QuestionSessionStorage` 使用独立版本化载荷保存会话；`QuestionAttemptResult` 只描述本次作答，自动评分只统计可评分题目，简答题保留人工审核状态。完整运行流和会话约束见 `QUESTION_ENGINE.md`、`QUESTION_ENGINE_DATA_FLOW.md`、`QUESTION_SESSION.md`、`QUESTION_VALIDATION.md` 与 `ASSESSMENT.md`。

Question Engine 不写入 `MasteryEvent`、`KnowledgeMastery`、`KnowledgeEnergy`、`WrongQuestion` 或 `Reward`。`masteryScore` 仍只受七种掌握事件影响且不做时间衰减；遗忘和复习提醒仍由 `KnowledgeEnergy` 独立处理。
