# 本届比赛提交清单

作品：LabLens 实验数据体检与可视化工作台。赛项：[第九届传智杯 AI 创新应用挑战赛](https://www.boxuegu.com/matchTrack/detail/?id=10039)。赛规核对依据见 [contest-requirements.md](contest-requirements.md)。

## 材料位置

| 材料 | 交付位置 | 核对方式 |
| --- | --- | --- |
| 源码与真实开发历史 | https://github.com/LoscX-X/Work-1 | 仓库 main、逐步提交与 README。 |
| 技术 PDF | `output/pdf/LabLens-Technical-Documentation.pdf` | 16 页，已逐页渲染检查，记录见 `docs/evidence/pdf-validation.json`。 |
| 核心 AI 迭代 | `docs/ai/01`、`02`、`03` 及实际公开对话摘录 | 任务、真实修复、验证和对应 Git 提交相互对应。 |
| 十分钟复现 | `README.md`、`.env.example`、`Start-LabLens.cmd` | 源码构建或含 dist 的预构建包。 |
| 样例与清洗配置 | `public/samples/` | 163 行原样例，七步配置回放后 150 行。 |
| 实际导出与验证 | `docs/evidence/`、`docs/validation.md` | 浏览器实际文件、独立统计核查和覆盖边界。 |
| 视频 | 参赛者录制的 `LabLens-demo.mp4` | 5—8 分钟、1080p、至少 2 分钟实际 AI 协作过程。 |

完整本地交付包、版本清单和校验和位于 `output/release/`，由 `tools/package_release.py` 从干净 Git 当前树和新构建 dist 生成。ZIP 内附离线 main 历史和逐文件校验和，已经完成实际读取与克隆核对；该目录不作为源码重复提交到 Git。

## 提交前由参赛者完成

- [ ] 在本人比赛账号确认赛项、组别和账户已具备提交权限。
- [ ] 按 `recording-guide.md` 实际录制并检查 MP4。
- [ ] 打开仓库链接，确认源码、历史和材料可供评审访问。
- [ ] 在官网个人中心的对应竞赛流程中填写仓库链接，上传 PDF、AI 记录和 MP4，按页面实际字段操作。
- [ ] 核对文件大小限制、当前账号通知和提交截止，再确认提交。
- [ ] 保存“最终作品提交成功”状态或回执，确认提交的是最终版本。

根据已读取的 2026-11-11 官方赛程通知，本作品赛省赛最终提交截止为 **北京时间 2026-11-18 15:00**。规则或账户补充通知变化时，以适用于本赛项的最新通知为准。[官方通知](https://www.boxuegu.com/matchNotice/)

报名、缴费、视频成片和官网提交成功状态需要各自核实。本地文件完成、仓库推送成功不能代替比赛提交成功。
