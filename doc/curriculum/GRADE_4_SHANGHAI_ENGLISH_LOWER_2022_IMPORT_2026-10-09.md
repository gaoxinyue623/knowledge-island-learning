# 沪教牛津四年级下册英语接入记录

依据用户 2026-10-09 提供的双语文本接入，版本年份、页码及音标沿用来稿，未声称经过出版社原书逐页校验。完整来源保存在课程目录 source-text.md，contents.json 与 papers.json 记录同一 SHA-256。

- 独立教材 ID：G4_SHANGHAI_ENGLISH_S2_2022；四年级、下册、英语，按年级和版本选择，对所有账号开放，不依赖地区。
- 8 个 Unit、2 个 Project、1 个综合小练习栏目；55 个核心词条（按单元统计）。Reading、中译文、Grammar、Sounds/Sound 和 Intonation 保留。词汇表附音标，重复提供的词表不重复建立学习词条。
- triangle 在音乐单元译为“三角铁”，在美术单元译为“三角形”，训练和自动测验保持单元词义边界。
- 英语跟读沿用当前服务，只朗读英文文本；音标和语音栏目说明不混入朗读。Phonics 仅收到字母组合，Intonation 仅收到栏目名称，未补造官方音频或语调标记。
- 24 道项目原创基础题用于正式学习与既有 AI 接口，每单元支持三轮强化训练。海报 Project 以作品交流完成，不自动判分。
- 39 道用户提供的配套题按 9 组接入，题量依次为 5、5、4、3、4、5、4、4、5。配对题拆为逐项选择，填空按英文归一化判分，原始题面和答案保留；无额外百分制分值。
- 配套题使用 unit-sync-only 标签，165 道自动词汇补充题使用 comprehensive-only 标签，两者与基础题保持各自用途。项目活动与独立综合练习栏目不进入自动单元/期末测验抽题范围。

验证覆盖：来源哈希、全部双语正文/词条/语音栏目、两个账号教材可见性、年级与版本边界、11 个详情页、9 组配套练习入口、每个选择项及填空答案、短语排序与拼写训练、triangle 词义隔离、综合测验范围和模拟模型调用契约。未使用真实模型额度进行验证。

验证结果：新增 21 项集成测试和 4 项综合测验覆盖测试通过。全量 137 个文件、1711 项测试首次运行 1710 项通过，唯一失败为旧测试仍期望四下英语未接入；更新该断言后，相关文件 25 项复测全部通过。类型检查、生产构建、ESLint 和本次修改文件格式检查通过。构建仍提示已有的大包体积问题。本地前端（5173）、家庭/宠物 API（8787）和 Agent API（8788）已重新加载并返回 HTTP 200。

## 2026-10-12：按两张目录图片订正

用户指定这两张图为沪教牛津英语四年级下册（2022新版）目录。图片保存于 `src/data/curriculum/grade-4/english-shanghai-lower-2022/sources/contents-01.png` 与 `contents-02.png`；转录、栏目题目、页码及两张图片的 SHA-256 保存在同目录的 `contents-directory-correction.json`。

- 8个Unit的Big Question、Get ready词汇、Explore阅读题目、Sounds/Intonation和Grammar逐项对照图片。
- 补齐每个Unit的Communicate Listening、Speaking、Writing目录题目及Extend*阅读题目；Extend保留星号。目录题目显示于详情页，不混入课文连续跟读。
- 正式目录名称为Project 1（81页）、Project 2（83页）、Unit checklist（85页）、Word list（86页）。地图按目录页码排序，现有Unit及Project的内部ID不变；两个新入口使用14、15号ID，避免占用既有综合练习和语音补充ID。
- Word list以既有55个核心词条按单元汇总，音标与释义沿用原词汇来源。Unit checklist当前接入图片中的栏目名称与页码。
- 目录图只提供栏目题目，未据此生成Communicate、Extend或Unit checklist的教材正文。既有双语文本与项目练习保留各自来源；12单元Phonics及Intonation补充资料仍独立列在正式目录之后。

| Unit | Explore Reading | Extend* Reading |
| --- | --- | --- |
| 1 | Li Ming’s and Li Liang’s day | Jiajia needs a schedule |
| 2 | We all like our school! | Come and join us! |
| 3 | A dentist comes to school! | At the fire station |
| 4 | Let’s make music! | Different musical instruments |
| 5 | Shapes in art | The world of paper-cuts |
| 6 | What time is it? | Keeping up with time |
| 7 | Let’s make ice cream! | What is our world made of? |
| 8 | Poems about being polite | Act like a team! |

校验：目录订正、课程/地图集成、阅读排版和英语跟读4个测试文件共69项通过；类型检查、生产构建和修改文件ESLint通过。构建保留既有大包体积提示。课程结构审计0错误，图片来源哈希均有匹配文件；核对清单同步反映8单元目录已由用户图片确认，12单元语音补充稿归属仍待核对。
