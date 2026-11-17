# 往届传智杯作品核查与 LabLens 取舍

核查日期：北京时间 2026 年 11 月 17 日。研究目的为改进原创开发中的 LabLens；不下载、复制或改装往届项目代码，不改变本项目既定交付截止与用户自行录屏的分工。

## 可以据此作出的判断

本届「AI创新应用挑战赛」的核心是 Vibe Coding。第八届官方报名通知、获奖公告列出的相近赛项是「AI大模型创新应用挑战赛」和「AI Web网页开发挑战赛」；第七届院校通知中的大模型赛又采用基于阿里云 ACA 考纲的选择题与实操形式。此次查到的往届作品只能作为**相邻赛道的选题、交付与工程参考**，不能当作本届同题获奖样板，也不能据此推测获奖分数或保证获奖。[本届官方赛项](https://www.boxuegu.com/matchTrack/detail/?id=10039)、[本届官方公开赛项数据](https://gateway.boxuegu.com/portal-marketing/competition/track/detail?id=10039)、[第八届官方报名通知](https://www.boxuegu.com/matchNotice/detail/?id=10051)、[第七届成都信息工程大学通知](https://rjgcxy.cuit.edu.cn/info/1039/3698.htm)

截至本次核查，没有取得一份同时满足「第七/八届、与本届同赛题、官方确认获奖、可以实际操作或完整观看实现」的样本。下面明确区分官方奖级、作者自称、公开视频元数据与实际读过的源码；不把宣传稿或视频标题当成产品实测。

## 官方获奖名单与优秀作品入口

这些链接直接来自组委会公告，适合进一步人工核对。官网动态页面的文本抓取不完整，本次只读检查了页面公开脚本及其实际使用的 GET 接口，未访问账户信息。

| 资料 | 可以确认的事实 | 尚未确认的内容 |
| --- | --- | --- |
| [第八届全国总决赛获奖公告](https://www.boxuegu.com/matchNotice/detail/?id=10083)；[同一公告的官方原始数据](https://gateway.boxuegu.com/portal-marketing/competition-notice/detail?id=10083) | 组委会公告分别列出大模型、AI Web 等赛道的正式获奖名单链接。数据中的创建日期为 2026-06-18，正文落款为 2026-06-23，二者不混用。 | 公告本身不展示作品实现。 |
| 第八届[AI大模型国赛名单](https://www.kdocs.cn/l/cqIBeVYTaMlA)、[AI Web国赛名单](https://www.kdocs.cn/l/chnTOnl9DlGz) | 两个名单地址均由上项官方公告直接链接。 | 本环境请求金山文档后获得登录页面，未读到名单内部的作者、作品标题和奖级，不能拿它们为下面的作者自称背书。 |
| [第七届全国总决赛获奖公告](https://www.boxuegu.com/matchNotice/detail/?id=10050)；[官方原始数据](https://gateway.boxuegu.com/portal-marketing/competition-notice/detail?id=10050) | 公告分别链接人工智能大模型、Web 等赛道名单；数据创建日期为 2025-05-07，正文落款为 2025-05-08。 | 本公告不含演示或源码。 |
| 第七届[人工智能大模型国赛名单](https://kdocs.cn/l/cgcT7DuondyI)、[Web国赛名单](https://kdocs.cn/l/coBlYIWFbqAg) | 地址从官方公告中对应赛道的锚文本提取，而非根据相近链接猜测。 | 名单内部未独立读到，未核实下面开源作者的具体获奖条目。 |
| [官方备赛专区](https://www.boxuegu.com/matchGoods/)；[岭南院校发布的备赛说明](https://lnc.edu.cn/gc/tzgg/content_32713) | 院校正式说明称备赛资源包含往届国赛一等奖、省赛一等奖优秀作品合集。 | 当前备赛专区所用公开资源接口返回公开课、集训营和提升课程，没有从本次返回值中定位到可直接打开的优秀作品合集；不能因此断言合集不存在。 |
| [第八届备赛手册](https://www.kdocs.cn/l/cePRorxSr22v) | 该地址由[西安石油大学教务处第八届报名通知](https://jwch.xsyu.edu.cn/info/1094/3804.htm)直接提供。 | 本环境同样读到登录页，未提取到合集内部条目。 |

为便于复核，备赛专区公开资源数据地址为 [type=1](https://gateway.boxuegu.com/portal-marketing/competition/track/goods?type=1)、[type=2](https://gateway.boxuegu.com/portal-marketing/competition/track/goods?type=2)、[type=3](https://gateway.boxuegu.com/portal-marketing/competition/track/goods?type=3)。这里只记录当前读取结果，不能将其等同于该网站所有可用资源。

## 有官方院校奖级依据的具体案例

### 1. 智农慧田团队：第七届 Web 国赛一等奖

成都东软学院正式报道确认：奉伟强、段诗琪、赵佳漪组成的「智农慧田」团队，在刘德余老师指导下获得第七届 Web网页开发挑战赛国赛一等奖。**智农慧田是报道确认的团队名，报道没有另行给出正式作品标题。**报道将其问题起点写为农业园区数字化转型困境，方案围绕种植、生产、销售、溯源构成一体化流程，并描述按功能迭代从零开发。[成都东软学院原文](https://zs.nsu.edu.cn/Html/Content/12176_2025_5_9.html)

证据边界：已核实院校发表的团队、奖级和方案描述；未取得作者源码、可运行站点或演示原视频，未实测全产业链功能，不能将报道中的效果性措辞当成验收结果。这也是 Web 相邻赛道，并非本届 Vibe Coding 同赛题。[同一院校原文](https://zs.nsu.edu.cn/Html/Content/12176_2025_5_9.html)

对 LabLens 的可执行启发（设计推论）：材料应从一个具体困难切入，并把输入、处理和可交付结果连起来。本项目用「本科实验课的传感器标定表：格式混乱、重复测量、异常点影响拟合」作为单一演示主线即可。无需仿照农业平台扩大业务模块；报道只能支持借鉴其问题叙事方法，不能证明其广度就是获奖原因。[推论所据案例](https://zs.nsu.edu.cn/Html/Content/12176_2025_5_9.html)

### 2. 《AI个性化学习平台》：第八届省赛一等奖

广西城市职业大学正式发布称，萧明昊、农文管、梁燃团队以《AI个性化学习平台》获第八届传智杯**省赛一等奖并晋级全国总决赛**；文中描述采用 Next.js、Spring Boot 3，集成 DeepSeek、通义千问，实现学情分析、路径规划和答疑。[广西城市职业大学原文](https://www.gxcvu.edu.cn/rgznydsjxy/jyjx/content_9745)

证据边界：报道未在正文明确该项目报名的具体赛道，不能擅自标为「AI创新应用」或「AI Web」；「晋级国赛」不等于「国赛获奖」。本次只读到了院校方案描述，未获取代码、运行站点或可观看演示，技术栈与效果未独立运行验证。[同一院校原文](https://www.gxcvu.edu.cn/rgznydsjxy/jyjx/content_9745)

对 LabLens 的可执行启发（设计推论）：以明确使用者组织能力链，比列出依赖名称更容易理解。将本项目叙事收束为「实验数据导入 → 体检定位 → 确认清洗 → 拟合与可视化 → 可追溯报告」，不因为相邻项目用了大模型而新增聊天、账号或 RAG。[推论所据案例](https://www.gxcvu.edu.cn/rgznydsjxy/jyjx/content_9745)

### 3. 第八届大模型国一等奖的可核实获奖人线索

广东工商职业技术大学正式报道确认林喆获得第八届「AI大模型创新应用挑战赛」全国一等奖、邓毅涛获得该赛道全国三等奖。报道没有给出作品标题、作者仓库或演示链接，因此本项只作为奖级核查入口，不能用来评价产品功能或反推获奖标准。[广东工商职业技术大学原文](https://www.gdbtu.edu.cn/contents/1228/54732.html)

## 作者开源项目：有源码，奖级仍是自称

### Intelligent-Chat-Robot／智聊机器人

[hlx923/Intelligent-Chat-Robot](https://github.com/hlx923/Intelligent-Chat-Robot) 的作者说明称作品参加 2025 年传智杯人工智能大模型创新应用赛并获国家一等奖，README 署贡献者许语梦。README 描述 Streamlit、Ollama、本地模型、语音、图片和情感交互。本次经 GitHub 连接器实际读取了 `app.py`、`utils.py`，没有克隆、运行或复制代码。[作者 README](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/README.md)

奖级边界：未能在可读官方名单或院校原文中找到「许语梦—该作品—国一」的交叉印证，README 也未明确届次。因此保留为**作者自称 2025 年国一、届次未独立确认**，不改写成已核实第七届国一。另一个 [AllenMao 同名仓库](https://github.com/AllenMao/Intelligent-Chat-Robot) 的介绍内容高度相同，本报告不把它重复计为第二个获奖作品。[作者声明](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/README.md)、[同名仓库 README](https://github.com/AllenMao/Intelligent-Chat-Robot/blob/All/README.md)

从实际入口文件读到的架构与展示方式如下。这是源码观察，未执行外部项目，不能冒充界面实测。

| 已读位置 | 能从实现证明的内容 | 对 LabLens 的有限参考 |
| --- | --- | --- |
| [app.py 页面与样式定义](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/app.py#L52) | Streamlit 宽屏布局；消息卡片限定宽度，用户与助手分别定义蓝、紫背景，系统消息居中。 | 可用明确的区域和状态区别组织界面；无需复制其聊天形态。 |
| [app.py 会话与侧栏](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/app.py#L97) | `session_state` 保存消息与当前模型；侧栏定义自动/手动模型、参数滑块、功能开关和状态信息；主区逐条呈现角色、内容与时间戳。这里只证明控件和状态代码存在，不证明所有控件都影响底层模型。 | 当前数据集、处理状态、历史操作应可见，设置与结果的关系应能实际验证。 |
| [utils.py 模型管理](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/utils.py#L9)与[语言、情感处理](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/utils.py#L100) | UI 之外分出 Ollama 模型管理、语言处理与情感分析类；生成入口调用模型管理器，再清理响应。情感模型加载失败时有关键词分支。 | 文档可用明确的职责和数据流解释架构；不因其技术清单给 LabLens 引入模型服务。 |

实际代码观察：`app.py` 的图片上传分支读取并显示图片，然后将一条固定文本传给 `generate_response`；该入口随后调用 `model_manager.generate_response`，最后是 `client.generate(model_name, prompt)`。在这条已读的主界面调用路径里，没有把上传图片的数据传入模型调用。这个观察只涉及所读 `All` 分支路径，不等于对提交时版本、全部历史或实际获奖评审过程作判断。[app.py 第 180 行起](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/app.py#L180)、[utils.py 第 163 行起](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/utils.py#L163)、[底层生成调用](https://github.com/hlx923/Intelligent-Chat-Robot/blob/All/utils.py#L89)

对 LabLens 的直接启发：不能用「上传控件出现、图表显示、README 写有功能」替代输入真正驱动结果的验证。验收时应换一个实际 CSV/XLSX 输入，确认行列、问题位置、清洗结果、拟合参数和导出报告同步改变；对比撤销前后和重新打开导出文件的内容。此建议来自上述可完整追踪的静态路径，不依赖该作者的奖级真假。

源码读取快照：`app.py` 内容 blob SHA 为 `c415f73c1b957eb525f9954a820c185c9da8ef7f`，`utils.py` 为 `de2b54316360527806cc9bc1425137694c90b4e8`。链接指向可变分支，后续代码可能不同。

## 已定位的往届公开视频

以下为 B站官方公开视频接口读取到的**作者投稿元数据**，不是比赛组委会优秀作品认证。本次无法实际播放画面，因此不宣称看过实现，不根据标题推断功能质量、创新性或奖级。日期按北京时间换算，时长来自原视频元数据。

| 原视频 | 作者账号 | 可核实信息 | 未核实信息 |
| --- | --- | --- | --- |
| [第八届传智杯AI大模型创新应用挑战赛 AI CareerPilot 演示视频](https://www.bilibili.com/video/BV1bwV36mEcD/) | bili_98039054946 | 标题明确第八届、大模型赛、AI CareerPilot；2026-05-30 发布，8分14秒。[原始元数据](https://api.bilibili.com/x/web-interface/view?bvid=BV1bwV36mEcD) | 简介仅为「-」；未确认作者真实姓名、奖级、仓库或实现。 |
| [传智杯-AI大模型创新应用挑战赛国赛](https://www.bilibili.com/video/BV1dgVg6pEwu/) | 青川柏 | 标题称国赛；2026-05-30 发布，4分37秒。[原始元数据](https://api.bilibili.com/x/web-interface/view?bvid=BV1dgVg6pEwu) | 标题未写届次、作品名，不能仅凭发布日期就确定第八届；未核实获奖。 |
| [AI大模型创新应用挑战赛作品视频讲解](https://www.bilibili.com/video/BV1pSV86tEit/) | 凌闟廷 | 2026-05-29 发布，5分04秒。[原始元数据](https://api.bilibili.com/x/web-interface/view?bvid=BV1pSV86tEit) | 标题未写届次或作品名；简介仅为「-」，未核实获奖。 |

补充搜索出现过标题含第八届与 UID-2004272 的投稿，但进一步公开搜索触发 B站 412 风控，未取得可靠直达 ID，本报告不将搜索结果拼成视频链接。也没有把 2026 年 10—11 月的第九届参赛演示归入「往届获奖作品」。

## 截止前对 LabLens 的实施建议

以下为基于上述来源、本项目既定范围及已核对赛项要求作出的设计建议，不是从获奖名单统计得出的因果结论。当前本届材料与评分依据见[官方赛项](https://www.boxuegu.com/matchTrack/detail/?id=10039)，具体核对记录见本仓库 `docs/contest-requirements.md`。

| 优先级 | 在既定范围内完成的事 | 依据与验收证据 |
| --- | --- | --- |
| P0 | 固定一个本科实验课标定数据的完整演示故事。保留一份原始样例，并让同一份文件贯穿导入、问题定位、清洗、拟合、报告。 | 相邻获奖案例可借鉴的共同点是明确场景及连贯流程；这不是对其实际功能质量的实测。让评审能用自己的输入替换样例，验证真实用途。 |
| P0 | 把至少三条真实 AI 迭代链绑定到功能和 Git 提交：导入/类型确认、可撤销清洗、拟合/导出。只记录实际发生的引导与修复。 | 本届强调开发演进与可复现；不要把研究旧项目的时间换成新增产品功能，也不补造开发对话。[本届官方要求](https://www.boxuegu.com/matchTrack/detail/?id=10039) |
| P0 | 进行一次正常界面的完整输入到输出验证：真实导入文件、清洗确认、撤销/重做、拟合变化、导出后重新打开。另用一份不同的数据复查结果确实改变。 | 开源样本说明 README 能力声明与具体数据流需分别核对。记录真实结果与尚未覆盖的格式/浏览器，不能用静态截图或算法单测冒充端到端验证。 |
| P0 | 从干净目录按 README 启动并走演示，报告真实耗时、依赖和入口；同一版本的报告、PDF、截图、脚本彼此一致。 | 本届复现要求优先于往届采用何种框架。保持当前本地数据处理方案，可减少截止前引入服务与密钥的成本。[本届官方要求](https://www.boxuegu.com/matchTrack/detail/?id=10039) |
| P1 | 清洗前展示受影响行列、处理依据与预览；清洗后保留操作记录。图表和报告能追溯到导入数据与用户确认的处理。 | 将 LabLens 已有「体检、可撤销、可追溯」目标做成看得见的行为；避免仅以图表数量或大屏效果陈述价值。此项是本项目设计判断。 |
| P1 | 录屏脚本按约 6—7 分钟组织，预留至少 2 分钟真实 AI 协作证据；用户实际录制前以最终版本逐步走一遍。 | 本届要求的 5—8 分钟和 AI 片段是当前规则；往届视频 4分37秒或8分14秒都不能作为本届合规依据。[本届官方视频要求](https://www.boxuegu.com/matchTrack/detail/?id=10039) |

截止前不因相邻案例扩展到聊天机器人、文献 RAG、语音、多语言、账号、多用户协作或额外在线服务。本届 Vibe Coding 中的 AI 开发过程与「成品必须是大模型产品」不是同一要求；是否调整范围应依据本届明文规则与用户目标，而非相邻赛道的技术清单。[本届官方赛项介绍](https://www.boxuegu.com/matchTrack/detail/?id=10039)、[院校对本届两个人工智能赛项的分别说明](https://dw.zjtu.edu.cn/content/tzgs/202610/2463.html)

## 保留的证据缺口

- 未读到金山名单内部，未能核实开源项目作者的奖级；官方公告能证明名单入口的来源，不能代替名单条目。
- 未实际观看上述视频，未运行外部作品；所有产品行为描述均标为院校描述、作者声明或具体静态代码观察。
- 官方优秀作品合集的具体直达入口尚未取得；没有将院校说明或当前资源接口结果扩大为「合集已看完」或「合集不存在」。
- 没有找到可充分确认的第七/八届本届 Vibe Coding 同赛题获奖作品；相邻比赛要求不可直接移植。

因此本次研究最可靠的产出，是明确可继续核对的一手入口、区分了三种证据强度，并把 LabLens 的改进限制在真实流程、可复现性和开发证据。没有采用外部项目代码，也不以尚未验证的奖级或演示效果为依据新增功能。
