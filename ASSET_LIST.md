# 知识岛｜PHASE 3.1 资产清单

> 文档状态：PHASE 3.1 资产规划（仅清单与规格，当前不生成或接入正式资产）  
> 事实来源：`VISUAL_DIRECTION.md`、`CHARACTER_DESIGN.md`、`DESIGN_SYSTEM.md`、`MOTION_SYSTEM.md`、`DATA_MODEL.md`、`QUESTION_SCHEMA.md`  
> 资产原则：所有课程、题目和角色未来通过 `mediaAssetId` 引用 `MediaAsset`；本清单不填写真实教材图片、真实地区教材关系或未经授权的第三方素材。

## 1. 使用规则

### 1.1 MVP 优先级

- **P0**：Home、LearningMap、Lesson、Question、Result 和 Onboarding 首次走通所必需。
- **P1**：提升探索和解释体验，但可以先用中性占位资产。
- **P2**：个性化、宠物、更多世界、丰富奖励和非核心装饰，PHASE 3.1 不阻塞工程开始。

资产清单中的“是”表示视觉规格必须锁定；不表示该文件已经存在，也不表示已经通过版权审核。

### 1.2 命名和引用

建议使用稳定的 `assetKey`，最终入库时生成 `MediaAsset.id`。页面和课程内容只保存 `mediaAssetId`，不能保存真实 URI。推荐命名：

```text
<领域>_<主体>_<状态>_<变体>

示例：KnowledgeDango_Happy_Default
      MathMap_Node_Current
      Onboarding_RegionSearch_Illustration
```

每一项正式入库必须补齐 `sourceId`、`copyrightStatus`、`license`、`status`、`version`、`createdAt`、`updatedAt`；`needsVerification=true` 的资产不得进入正式 PUBLISHED 内容。

### 1.3 MediaAsset 最小登记字段

| 字段 | 要求 |
| --- | --- |
| `id` | 稳定唯一 ID |
| `mediaType` | `IMAGE`、`AUDIO`、`VIDEO`、`ANIMATION`、`SVG` 之一 |
| `storageKey` | 内部存储键；不可把存储路径当业务事实展示 |
| `url` | 由资源服务生成的访问地址；不写入 `QuestionMedia` |
| `mimeType` | 与格式一致 |
| `width` / `height` | 图片、SVG、动画或视频必须记录；音频可为空 |
| `durationSeconds` | 音频/视频/动画按实际记录，静态图片为空 |
| `altText` | 非装饰资产必填；装饰资产明确标记为装饰性 |
| `transcript` | 音频/视频/有声媒体需要时填写 |
| `sourceId` | 追踪创作来源、教材来源或授权凭证 |
| `copyrightStatus` | 版权确认状态，未确认不能发布 |
| `license` | 许可类型和限制 |
| `status` | 服从媒体内容审核生命周期 |
| `version` | 每次实质替换递增 |
| `createdAt` / `updatedAt` | 审计时间 |

### 1.4 占位资产规则

占位资产只能表达布局、尺寸、状态和可访问性，不得伪装成真实教材插图、真实出版社标识或真实地区教材封面。建议用中性几何块、通用线稿和 `PLACEHOLDER` 后缀；`isSample=true`、`needsVerification=true` 时只用于设计和开发测试。

## 2. Characters

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `KnowledgeDango_Default` | 是 | SVG / PNG | `512×512` | 是 | 否 | 否 | canonical 默认站立，非对称软方团轮廓 |
| `KnowledgeDango_Idle` | 是 | SVG / PNG | `512×512` | 是 | 是 | 轻量呼吸可选 | Home、地图空闲 |
| `KnowledgeDango_Happy` | 是 | SVG / PNG | `512×512` | 是 | 否 | 轻抬/点头 | CTA 引导、轻成功 |
| `KnowledgeDango_Think` | 是 | SVG / PNG | `512×512` | 是 | 否 | 头部极轻偏转 | Lesson、首次错误 |
| `KnowledgeDango_Encourage` | 是 | SVG / PNG | `512×512` | 是 | 否 | 手掌打开 | 再试一次、提示 |
| `KnowledgeDango_Success` | 是 | SVG / PNG | `512×512` | 是 | 否 | 上举/短庆祝 | 正确、完成页 |
| `KnowledgeDango_Walk` | 是 | SVG / PNG / sprite | `512×512` 每帧 | 是 | 是 | 短步循环 | 地图沿路径移动 |
| `KnowledgeDango_Sleep` | 否 | SVG / PNG | `512×512` | 是 | 否 | 否 | 非核心休息状态 |
| `KnowledgeDango_Surprised` | 否 | SVG / PNG | `512×512` | 是 | 否 | 否 | 只用于知识发现，不用于错误 |
| `KnowledgeDango_Outfit_Set` | 否 | SVG 图层 | `512×512` | 是 | 是 | 否 | 围巾、背包、护目镜、学科徽章 |
| `KnowledgeDango_Thumbnail` | 是 | SVG / PNG | `128×128` | 是 | 否 | 否 | Header、设置、列表小头像 |

角色主资产必须遵守 `CHARACTER_DESIGN.md` 和 `VISUAL_DIRECTION.md` 的原创边界：不复制蛋形身体、固定双圆眼、四肢比例或面部排布。角色图层优先拆为主体、表情、顶部标记和 outfit，便于状态切换，不把每个状态做成不可追踪的整张图片。

## 3. Character Expressions

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DangoFace_Default` | 是 | SVG | `256×256` | 是 | 是 | 否 | 中性表情 |
| `DangoFace_Happy` | 是 | SVG | `256×256` | 是 | 否 | 否 | 轻微微笑，不夸张 |
| `DangoFace_Think` | 是 | SVG | `256×256` | 是 | 否 | 否 | 思考，不表现羞耻 |
| `DangoFace_Encourage` | 是 | SVG | `256×256` | 是 | 否 | 否 | 鼓励 |
| `DangoFace_Success` | 是 | SVG | `256×256` | 是 | 否 | 否 | 答对/完成 |
| `DangoFace_Concern` | 否 | SVG | `256×256` | 是 | 否 | 否 | 仅提示需要复习，不等同失败 |
| `DangoMark_Knowledge` | 是 | SVG | `128×128` | 是 | 是 | 亮起可选 | 顶部知识标记 |
| `DangoMark_Subject_Chinese` | 否 | SVG | `128×128` | 是 | 否 | 否 | 学科 outfit 徽章 |
| `DangoMark_Subject_Math` | 否 | SVG | `128×128` | 是 | 否 | 否 | 学科 outfit 徽章 |
| `DangoMark_Subject_English` | 否 | SVG | `128×128` | 是 | 否 | 否 | 学科 outfit 徽章 |

表情资产不得单独承载正确/错误事实；事实必须同时通过文字、图标、边框或状态组件表达，避免色觉或动画不可用时信息丢失。

## 4. Character Actions

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DangoAction_PointForward` | 是 | SVG / sprite | `512×512` | 是 | 否 | 160–240ms | 指向今日任务/下一节点 |
| `DangoAction_Read` | 否 | SVG / sprite | `512×512` | 是 | 否 | 低 | Lesson 辅助 |
| `DangoAction_Write` | 否 | SVG / sprite | `512×512` | 是 | 否 | 低 | 练习辅助 |
| `DangoAction_CarryReward` | P1 | SVG / sprite | `512×512` | 是 | 否 | 低 | 完成页轻奖励 |
| `DangoAction_LocationPulse` | 是 | SVG / SVG animation | `128×128` | 是 | 否 | 240ms | 地图当前地点提示 |
| `DangoAction_Help` | 是 | SVG | `512×512` | 是 | 否 | 否 | 提示入口 |

角色动作只服务进入学习、理解、反馈、探索和成长。禁止加入催促继续、失败惩罚或竞争挑衅动作。

## 5. Subject Islands

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `KnowledgeIsland_Overview` | 是 | SVG / WebP 分层 | `1200×520` | 否/部分 | 否 | 轻微层次移动可选 | Home 主视觉 |
| `SubjectIsland_Chinese` | 是 | SVG / WebP | `480×320` | 否/部分 | 是 | 进入时 220ms | 故事林/文字街区 |
| `SubjectIsland_Math` | 是 | SVG / WebP | `480×320` | 否/部分 | 是 | 齿轮不自动持续旋转 | 计算工厂/数字世界 |
| `SubjectIsland_English` | 是 | SVG / WebP | `480×320` | 否/部分 | 是 | 轻量旗帜/路牌动效可选 | 语言港/表达站 |
| `SubjectIsland_Chinese_Placeholder` | 是 | SVG | `480×320` | 否 | 否 | 否 | 无正式插画时使用 |
| `SubjectIsland_Math_Placeholder` | 是 | SVG | `480×320` | 否 | 否 | 否 | 无正式插画时使用 |
| `SubjectIsland_English_Placeholder` | 是 | SVG | `480×320` | 否 | 否 | 否 | 无正式插画时使用 |
| `Island_Horizon_Layer` | 是 | SVG / WebP | `1200×220` | 是 | 否 | 低 | 统一三科地平线 |
| `Island_Path_Layer` | 是 | SVG | `1200×160` | 是 | 否 | 路径出现 220ms | Home 入口视觉 |

三科资产应共享光照方向、阴影软硬度、节点形状和角色尺度。学科差异通过场景语言和学科色表达，不用完全不同的材质系统。

## 6. Map Backgrounds

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `MathMap_CalculationFactory` | 是 | SVG / WebP 分层 | `1600×900` | 否/部分 | 否 | 仅层切换 | 数学地图主背景 |
| `MathMap_NumberWorld` | P1 | SVG / WebP 分层 | `1600×900` | 否/部分 | 否 | 低 | 数字世界变体 |
| `MathMap_GeometryMechanism` | P1 | SVG / WebP 分层 | `1600×900` | 否/部分 | 否 | 低 | 几何机关变体 |
| `ChineseMap_StoryForest` | P1 | SVG / WebP | `1600×900` | 否/部分 | 否 | 低 | 语文地图占位/变体 |
| `EnglishMap_LanguageHarbor` | P1 | SVG / WebP | `1600×900` | 否/部分 | 否 | 低 | 英语地图占位/变体 |
| `Map_SoftSky_Background` | 是 | SVG / WebP | `1600×900` | 否 | 否 | 否 | 无正式世界背景时的中性底 |

移动端优先提供可裁切的分层背景：关键路径和节点不能位于不可见安全区；复杂背景可以移除，不影响地图理解。

## 7. Map Decorations

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `MathDecor_Gear_Small` | 是 | SVG | `64×64` | 是 | 否 | 不持续旋转 | 轻装饰 |
| `MathDecor_NumberPipe` | 是 | SVG | `240×96` | 是 | 否 | 低 | 数字路径边缘 |
| `MathDecor_GeometryGate` | P1 | SVG | `220×180` | 是 | 否 | 进入时一次 | 机关装饰 |
| `ChineseDecor_StoryTree` | P1 | SVG / WebP | `260×260` | 是/部分 | 否 | 低 | 语文环境 |
| `EnglishDecor_SignPost` | P1 | SVG / WebP | `220×180` | 是/部分 | 否 | 低 | 英语环境 |
| `MapDecor_Cloud` | 是 | SVG | `180×90` | 是 | 否 | 静态/减弱 | 低对比度背景层 |
| `MapDecor_LockGate` | 是 | SVG | `160×180` | 是 | 是 | 打开一次 | 锁定说明 |
| `MapDecor_ReviewLantern` | P1 | SVG | `120×160` | 是 | 否 | 轻亮 | KnowledgeEnergy 复习入口 |

装饰不能成为导航唯一线索，不能遮挡 MapNode、路径或当前角色站位。

## 8. Map Nodes

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `MapNode_Base` | 是 | SVG | `96×96` | 是 | 是 | 否 | 统一节点底 |
| `MapNode_Completed` | 是 | SVG | `96×96` | 是 | 否 | 完成标记出现 | 已完成 |
| `MapNode_Current` | 是 | SVG | `112×112` | 是 | 否 | 轻外环 | 当前节点 |
| `MapNode_Available` | 是 | SVG | `96×96` | 是 | 否 | hover/press | 可进入 |
| `MapNode_Locked` | 是 | SVG | `88×88` | 是 | 否 | 否 | 锁定，带可读原因 |
| `MapNode_Boss` | 是 | SVG | `128×128` | 是 | 否 | 轻脉冲一次 | 知识里程碑，不是战斗失败 |
| `MapNode_Chest` | P1 | SVG | `112×112` | 是 | 否 | 打开一次 | 固定学习奖励，不是概率抽奖 |
| `MapPath_Main` | 是 | SVG | 自适应 | 是 | 否 | 220–320ms | 主路径 |
| `MapPath_Completed` | 是 | SVG | 自适应 | 是 | 否 | 否 | 已走过路径 |
| `MapPath_Locked` | 是 | SVG | 自适应 | 是 | 否 | 否 | 未解锁路径 |

节点图标可通过文字标签、状态颜色、形状和屏幕阅读器名称共同表达；禁止把“完成/锁定”只编码为颜色。

## 9. Knowledge Illustrations

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `KnowledgeIllustration_NumberLine` | 是 | SVG / WebP | `640×360` | 是/部分 | 否 | 逐步出现可选 | 数学知识卡 |
| `KnowledgeIllustration_CalculationSteps` | 是 | SVG / WebP | `640×360` | 是/部分 | 是 | 逐步高亮可选 | 计算过程 |
| `KnowledgeIllustration_GeometryShape` | P1 | SVG | `640×360` | 是 | 是 | 旋转一次可选 | 几何知识 |
| `KnowledgeIllustration_StoryStructure` | P1 | SVG / WebP | `640×360` | 是/部分 | 否 | 否 | 语文知识 |
| `KnowledgeIllustration_EnglishDialogue` | P1 | SVG / WebP | `640×360` | 是/部分 | 否 | 否 | 英语知识 |
| `KnowledgeIllustration_EmptyKnowledge` | 是 | SVG | `480×320` | 是 | 否 | 否 | 内容缺失/占位 |

知识插图必须有明确的 `altText`，若承载公式或文字事实，正文仍需保留可读结构化文本，不把全部知识藏进图片。

## 10. Icons

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Icon_MapPin` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 否 | Region |
| `Icon_Map` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 否 | 地区/地图 |
| `Icon_Navigation` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 否 | 地区导航 |
| `Icon_BookOpen` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 否 | 教材 |
| `Icon_Library` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 否 | 出版社/课程 |
| `Icon_BookMarked` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 否 | 教材确认 |
| `Icon_CheckCircle` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 160–240ms | 正确/确认 |
| `Icon_Lock` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 否 | 锁定 |
| `Icon_Lightbulb` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 低 | 提示 |
| `Icon_ArrowForward` | 是 | SVG | `24×24` / `32×32` | 是 | 是 | 低 | CTA |
| `Icon_Search` | 是 | SVG | `24×24` | 是 | 是 | 否 | Region 搜索 |
| `Icon_Filter` | 是 | SVG | `24×24` | 是 | 是 | 否 | WrongBook |
| `Icon_Settings` | 是 | SVG | `24×24` | 是 | 是 | 否 | 学习设置 |
| `Icon_Star` | 是 | SVG | `24×24` | 是 | 是 | 低 | 固定成长资源 |
| `Icon_Coin` | P1 | SVG | `24×24` | 是 | 是 | 低 | 成长资源，不是抽奖币 |
| `Icon_Review` | 是 | SVG | `24×24` | 是 | 是 | 低 | KnowledgeEnergy/复习 |

图标必须由 `AppIcon` 统一尺寸、颜色、焦点和可访问标签。禁止使用 Emoji、品牌出版社 logo 或未经授权的素材代替图标。

## 11. Rewards

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Reward_KnowledgeBadge` | 是 | SVG | `96×96` | 是 | 是 | 出现一次 | 知识点徽章 |
| `Reward_Star_Single` | 是 | SVG | `48×48` | 是 | 是 | 轻出现 | 固定学习成长 |
| `Reward_XP_Spark` | 是 | SVG | `64×64` | 是 | 否 | 低 | XP 视觉证明 |
| `Reward_Coin_Single` | P1 | SVG | `48×48` | 是 | 否 | 低 | 非随机资源 |
| `Reward_Completion_Ribbon` | P1 | SVG | `320×120` | 是 | 否 | 低 | Level Complete |
| `Reward_Review_Lantern` | P1 | SVG | `96×112` | 是 | 否 | 低 | 复习里程碑 |

奖励必须解释与学习结果的关系；不提供概率、盲盒、随机掉落或无限连锁奖励。

## 12. Pets

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Pet_Placeholder_Default` | 否 | SVG / PNG | `256×256` | 是 | 否 | 否 | 仅为未来个性化预留 |
| `Pet_Placeholder_Happy` | 否 | SVG / PNG | `256×256` | 是 | 否 | 低 | 不阻塞 MVP |
| `Pet_Collection_Silhouette` | 否 | SVG | `256×256` | 是 | 是 | 否 | 非抽卡展示 |

宠物不是 PHASE 3.1 核心资产；不得用宠物收集替代知识反馈，也不得让解锁依赖随机概率。

## 13. Effects

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Effect_SoftSuccess` | 是 | SVG / CSS | `240×160` | 是 | 否 | `160–240ms` | 答对局部高光 |
| `Effect_PathReveal` | 是 | SVG / CSS | 自适应 | 是 | 否 | `220–320ms` | 地图路径出现 |
| `Effect_NodeUnlock` | 是 | SVG / CSS | `160×160` | 是 | 否 | 一次性 | 节点解锁 |
| `Effect_RewardPop` | 是 | SVG / CSS | `240×180` | 是 | 否 | `320ms` 内 | 完成页轻反馈 |
| `Effect_FocusRing` | 是 | CSS/SVG | 自适应 | 是 | 是 | 否 | 键盘焦点/选中 |
| `Effect_Loading_Dango` | 是 | CSS/SVG | `96×96` | 是 | 否 | 低 | 加载状态 |
| `Effect_Error_Soft` | 是 | CSS/SVG | `160×96` | 是 | 否 | 不摇晃 | 局部错误提示 |

效果层必须可关闭或减弱；不使用红色全屏闪光、持续粒子、屏幕震动和强音效作为错误反馈。

## 14. Onboarding Illustrations

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Onboarding_Welcome_Island` | 是 | SVG / WebP | `720×420` | 否/部分 | 否 | 低 | 欢迎页岛屿 |
| `Onboarding_RegionSearch` | 是 | SVG | `480×320` | 是 | 否 | 否 | 选择地区辅助插图 |
| `Onboarding_GradeCards` | 是 | SVG | `480×320` | 是 | 否 | 否 | 年级选择辅助图 |
| `Onboarding_TextbookStack` | 是 | SVG | `480×320` | 是 | 否 | 否 | 教材确认辅助图，不含真实出版社封面 |
| `Onboarding_CharacterSetup` | 是 | SVG / WebP | `480×320` | 是/部分 | 否 | 低 | 角色设置 |
| `Onboarding_Complete_IslandGate` | 是 | SVG / WebP | `720×420` | 否/部分 | 否 | 低 | 进入知识岛 |
| `Onboarding_ParentHelp` | P1 | SVG | `320×240` | 是 | 否 | 否 | 家长协助入口 |

## 15. Question Media Placeholders

| assetKey | MVP | mediaType / 格式 | 推荐尺寸 | 透明 | 多状态 | 动画 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `QuestionMedia_Image_Placeholder` | 是 | SVG / PNG | `640×360` | 否/是 | 否 | 否 | 图片题布局占位 |
| `QuestionMedia_Audio_Placeholder` | 是 | SVG + audio placeholder | `640×96` | 是 | 是 | 播放状态 | 音频题播放条 |
| `QuestionMedia_Formula_Placeholder` | 是 | SVG | `640×160` | 是 | 否 | 否 | 公式布局占位，正式内容用 ContentBlock |
| `QuestionMedia_DragItem_Placeholder` | 是 | SVG | `240×96` | 是 | 是 | 拖动状态 | DragDrop item |
| `QuestionMedia_MatchingItem_Placeholder` | 是 | SVG | `240×96` | 是 | 是 | 选择状态 | Matching item |
| `QuestionMedia_SortingItem_Placeholder` | 是 | SVG | `240×96` | 是 | 是 | 移动状态 | Sorting item |
| `QuestionMedia_Reading_Illustration_Placeholder` | 是 | SVG | `640×360` | 否/是 | 否 | 否 | 阅读材料占位 |
| `QuestionMedia_Video_Placeholder` | P1 | SVG + video placeholder | `640×360` | 否 | 是 | 播放状态 | 未来视频题 |

题目媒体只由 `mediaAssetId` 引用；`QuestionMedia` 记录 `usageType` 和 `order`，不保存真实 URI。音频/视频必须在正式发布前完成 transcript、版权、来源和版本登记。

## 16. 交付与审核顺序

1. 先产出 P0 的中性 SVG/布局占位，验证页面比例、响应式和可访问标签。
2. 再制作 KnowledgeDango 全部 P0 状态和数学地图基础节点，先做轮廓原创性评审。
3. 再制作三科 SubjectIsland 和地图背景，确保统一光照/材质/节点语言。
4. 最后补充 P1/P2 的装饰、宠物和更多奖励，不让它们阻塞核心学习流。
5. 每个正式资产建立 MediaAsset 记录并完成来源、版权、许可、状态和版本审核；未审核资产保持 `needsVerification=true`，只能在样例/开发环境使用。

本清单只定义资产需求，不代表资产已经创建、上传、授权或发布。
