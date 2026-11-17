# 第三方依赖与来源说明

本文件按 2026 年 11 月 17 日本地项目的 `package.json`、`package-lock.json`、已安装包元数据，以及 `public/vendor/manifest.json` 和随包许可证整理。用途是记录本次交付中已核对的依赖版本、下载来源和许可文件，供源码分发、复现和技术文档引用。

核对范围包括 React 运行时、三个浏览器直接加载库、直接声明的开发工具和类型包。已保留下列主包及其随包声明。该范围不等同于对全部间接依赖、嵌入代码及最终分发场景完成法律审计。

## 浏览器运行时

| 依赖 | 实际版本 | 本项目用途 | 包声明的主许可证 | 随交付保留的许可 |
| --- | --- | --- | --- | --- |
| React | 19.3.1 | 应用组件和界面状态 | MIT | [React LICENSE](licenses/REACT-LICENSE.txt) |
| ReactDOM | 19.3.1 | 将 React 界面渲染到浏览器 DOM | MIT | [ReactDOM LICENSE](licenses/REACT-DOM-LICENSE.txt) |
| Scheduler | 0.28.0 | ReactDOM 的调度依赖 | MIT | [Scheduler LICENSE](licenses/SCHEDULER-LICENSE.txt) |
| Apache ECharts | 6.0.0 | 图表展示、交互及拟合结果可视化 | Apache-2.0，随包还列有子组件条款 | [ECharts LICENSE](licenses/ECHARTS-LICENSE.txt)、[NOTICE](licenses/ECHARTS-NOTICE.txt)、[d3 BSD 3-Clause](licenses/ECHARTS-D3-LICENSE.txt) |
| Papa Parse | 5.5.3 | CSV、TSV 解析与分隔文本处理 | MIT | [Papa Parse LICENSE](licenses/PAPAPARSE-LICENSE.txt) |
| ExcelJS | 4.4.0 | XLSX 工作簿读取及表格数据转换 | MIT | [ExcelJS LICENSE](licenses/EXCELJS-LICENSE.txt) |

React、ReactDOM、Scheduler 的实际安装版本与锁文件一致。三个包的 LICENSE 均保留 Meta Platforms, Inc. and affiliates. 的版权声明，归档副本与安装文件的 SHA-256 相同。软件包版本、解析地址和完整性字段可在 [package-lock.json](package-lock.json) 中核对。

Apache ECharts、Papa Parse 和 ExcelJS 的浏览器文件直接保存在 `public/vendor/`，由页面从本地加载，其版本、原始软件包下载链接及 SHA-256 记录在 [vendor 清单](public/vendor/manifest.json) 中。已按该清单重新计算三个浏览器文件的 SHA-256，结果一致。

### ECharts 的 NOTICE 与 d3 子组件

ECharts 随包 NOTICE 保留以下署名。

> Apache ECharts  
> Copyright 2017-2025 The Apache Software Foundation

完整声明见 [ECharts NOTICE](licenses/ECHARTS-NOTICE.txt)。ECharts 的 LICENSE 末尾还明确列出若干源文件嵌入的 d3.js 代码适用 BSD 3-Clause，并指向上游 `licenses/LICENSE-d3`。本项目将 ECharts 6.0.0 标签下该文件的原文归档为 [ECHARTS-D3-LICENSE.txt](licenses/ECHARTS-D3-LICENSE.txt)。该文本保留 Mike Bostock 的版权声明及三项再分发条件。[ECharts 6.0.0 子组件许可原文](https://raw.githubusercontent.com/apache/echarts/6.0.0/licenses/LICENSE-d3)

## 开发工具与类型定义

下表为实际安装版本，其中 `@types/node` 在根清单使用范围声明，最终安装版本由锁文件确定。工具的主许可证与工具包中嵌入依赖的声明需要一并保留。

| 依赖 | 实际版本 | 用途 | 主许可证 | 归档文件 |
| --- | --- | --- | --- | --- |
| TypeScript | 7.0.2 | 类型检查与构建前校验 | Apache-2.0 | [LICENSE](licenses/TYPESCRIPT-LICENSE.txt)、[NOTICE](licenses/TYPESCRIPT-NOTICE.txt) |
| Vite | 8.3.8 | 本地开发服务与前端构建 | MIT | [完整随包许可](licenses/VITE-LICENSE.md) |
| Prettier | 3.10.1 | 源码格式化 | MIT | [LICENSE](licenses/PRETTIER-LICENSE.txt)、[嵌入依赖声明](licenses/PRETTIER-THIRD-PARTY-NOTICES.md) |
| @types/node | 22.20.5 | Node.js API 类型定义 | MIT | [LICENSE](licenses/TYPES-NODE-LICENSE.txt) |
| @types/react | 19.3.0 | React 类型定义 | MIT | [LICENSE](licenses/TYPES-REACT-LICENSE.txt) |
| @types/react-dom | 19.3.0 | ReactDOM 类型定义 | MIT | [LICENSE](licenses/TYPES-REACT-DOM-LICENSE.txt) |

Vite 的完整 LICENSE 文件包含其随包代码的多项声明。Prettier 的第三方声明列出 MIT、BlueOak-1.0.0、ISC、BSD-3-Clause、Apache-2.0 和 BSD-2-Clause 等许可。TypeScript 的 NOTICE 也包含第三方材料信息。本项目按安装包原文保留这些文件，表中的主许可证用于标识各工具本身。

## 下载来源

React 系列、开发工具和类型包的下载地址取自当前 `package-lock.json`，镜像地址与项目当时实际锁定的来源保持一致。

| 包 | 锁定或归档的来源 |
| --- | --- |
| react 19.3.1 | [锁定软件包](https://registry.npmmirror.com/react/-/react-19.3.1.tgz) |
| react-dom 19.3.1 | [锁定软件包](https://registry.npmmirror.com/react-dom/-/react-dom-19.3.1.tgz) |
| scheduler 0.28.0 | [锁定软件包](https://registry.npmmirror.com/scheduler/-/scheduler-0.28.0.tgz) |
| echarts 6.0.0 | [vendor 原始软件包](https://registry.npmjs.org/echarts/-/echarts-6.0.0.tgz) |
| papaparse 5.5.3 | [vendor 原始软件包](https://registry.npmjs.org/papaparse/-/papaparse-5.5.3.tgz) |
| exceljs 4.4.0 | [vendor 原始软件包](https://registry.npmjs.org/exceljs/-/exceljs-4.4.0.tgz) |
| typescript 7.0.2 | [锁定软件包](https://registry.npmmirror.com/typescript/-/typescript-7.0.2.tgz) |
| vite 8.3.8 | [锁定软件包](https://registry.npmmirror.com/vite/-/vite-8.3.8.tgz) |
| prettier 3.10.1 | [锁定软件包](https://registry.npmmirror.com/prettier/-/prettier-3.10.1.tgz) |
| @types/node 22.20.5 | [锁定软件包](https://registry.npmmirror.com/@types/node/-/node-22.20.5.tgz) |
| @types/react 19.3.0 | [锁定软件包](https://registry.npmmirror.com/@types/react/-/react-19.3.0.tgz) |
| @types/react-dom 19.3.0 | [锁定软件包](https://registry.npmmirror.com/@types/react-dom/-/react-dom-19.3.0.tgz) |

上表用于追踪归档来源。原始压缩包的锁定完整性信息见 `package-lock.json`，三个浏览器直接加载文件的哈希见下表。

| 浏览器文件 | SHA-256 |
| --- | --- |
| `public/vendor/echarts.min.js` | `baa8dfe7e1d9336b98e8986ba7e20ea15e7cdbea1ef42a59d59478632fa45a1d` |
| `public/vendor/papaparse.min.js` | `3553fb8bdf5b8004ce5531e6827e81c8b34e7b3992677967754544064e97b016` |
| `public/vendor/exceljs.min.js` | `7e49da68588e250dbb8bba190d2caa8ab3787cc0284bda1d8b2f805c4df742c9` |

## 展示组件与视觉参考

本项目展示层使用项目自身编写的 React 组件。设计探索时参考了 Arc UI 的界面组织与视觉方向。当前实际依赖和交付代码中没有导入 TKCode.Arc 或 Arc UI 组件源码，因此二者在本文件中列为设计参考。项目的图表展示依赖为上表中的 Apache ECharts。

TKCode.Arc 是 Avalonia/.NET 组件库，Arc UI 是其所参考的 React 原型组件来源。两者用于说明设计探索的来源关系，各自的许可证与实际引用范围应对应核对。本次归档未复制二者组件或将其列为已采用的运行依赖。[TKCode.Arc](https://github.com/AIDotNet/TKCode.Arc) [Arc UI](https://uiarc.dev/) [Arc UI 许可说明](https://uiarc.dev/license)

## 本次核对与分发保留事项

- 已核对根清单、锁文件和上述已安装包的版本一致性。
- 已核对三个 vendor 浏览器文件与 manifest 中的 SHA-256 一致。
- `licenses/` 中来自已安装包和 `public/vendor/` 的 15 份副本均与原文件字节哈希一致。
- 已归档 ECharts LICENSE 所指向的 d3 子组件许可，来源为 ECharts 6.0.0 标签下的上游文件。
- 项目材料应保留本文件、`licenses/` 和 vendor 目录内的原有许可、NOTICE；对本项目修改第三方代码的情况，应记录实际修改范围。
- 本次没有逐一复核所有构建工具间接依赖、浏览器预打包库中的全部嵌入模块或未来新增依赖。最终分发范围变化时，需要据实际交付内容更新本文件。

各依赖的授权条件以对应完整许可证原文为准。本文件提供当前交付的来源和归档索引。
