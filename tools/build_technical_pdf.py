"""Build the competition technical PDF from project text and actual evidence.

Requires ReportLab and Pillow. These are authoring dependencies only; the app
does not require Python. Windows Deng fonts are embedded as subsets.
"""

from pathlib import Path
from datetime import datetime, timedelta, timezone
from xml.sax.saxutils import escape
import json

from PIL import Image as PillowImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, Preformatted, Flowable

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/LabLens-Technical-Documentation.pdf"
TMP = ROOT / "tmp/pdfs"
OUT.parent.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont("Deng", "C:/Windows/Fonts/Deng.ttf"))
pdfmetrics.registerFont(TTFont("DengBold", "C:/Windows/Fonts/Dengb.ttf"))
pdfmetrics.registerFont(TTFont("Mono", "C:/Windows/Fonts/consola.ttf"))
pdfmetrics.registerFontFamily("Deng", normal="Deng", bold="DengBold")

INK = colors.HexColor("#22313e")
MUTED = colors.HexColor("#647787")
GREEN = colors.HexColor("#718f56")
PALE = colors.HexColor("#f0f5e9")
LINE = colors.HexColor("#dfe6e9")
WIDTH = A4[0] - 90
STYLES = {
    "body": ParagraphStyle("body", fontName="Deng", fontSize=10.2, leading=15.6, textColor=INK, spaceAfter=9, wordWrap="CJK"),
    "small": ParagraphStyle("small", fontName="Deng", fontSize=8.6, leading=12.5, textColor=MUTED, spaceAfter=7, wordWrap="CJK"),
    "heading": ParagraphStyle("heading", fontName="DengBold", fontSize=23, leading=31, textColor=INK, spaceAfter=10, wordWrap="CJK"),
    "sub": ParagraphStyle("sub", fontName="DengBold", fontSize=12.2, leading=18, textColor=GREEN, spaceBefore=12, spaceAfter=7, wordWrap="CJK"),
    "cell": ParagraphStyle("cell", fontName="Deng", fontSize=9.2, leading=13.2, textColor=INK, wordWrap="CJK"),
    "th": ParagraphStyle("th", fontName="DengBold", fontSize=9.2, leading=13.2, textColor=colors.white, wordWrap="CJK"),
    "code": ParagraphStyle("code", fontName="Mono", fontSize=8.3, leading=13, textColor=INK, backColor=colors.HexColor("#f4f6f8"), borderPadding=12, spaceBefore=7, spaceAfter=16),
    "caption": ParagraphStyle("caption", fontName="Deng", fontSize=8, leading=11.5, textColor=MUTED, spaceBefore=6, spaceAfter=11, wordWrap="CJK"),
    "kicker": ParagraphStyle("kicker", fontName="DengBold", fontSize=9, leading=14, textColor=GREEN, spaceAfter=12),
    "hero": ParagraphStyle("hero", fontName="DengBold", fontSize=49, leading=59, textColor=INK, spaceAfter=8),
}

final = json.loads((ROOT / "docs/evidence/final-demo/final-audit.json").read_text(encoding="utf-8"))
filled = json.loads((ROOT / "docs/evidence/browser/imputation-audit.json").read_text(encoding="utf-8"))
repro = json.loads((ROOT / "docs/evidence/reproduction.json").read_text(encoding="utf-8-sig"))
FIT = final["analysis"]["regression"]
ORIGINAL = final["analysis"]["original"]["regression"]
SOURCE_HASH = final["source"]["sha256"]
DATE = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
story = []
TITLES = []


def p(text, style="body"):
    return Paragraph(text.replace("\u2212", "-"), STYLES[style])


def para(text, style="body"):
    story.append(p(text, style))


def title(name, subtitle):
    if TITLES:
        story.append(PageBreak())
    TITLES.append(name)
    para(f"{len(TITLES):02d} / LABLENS", "kicker")
    para(name, "heading")
    para(subtitle, "small")
    story.append(Spacer(1, 8))


def sub(name):
    para(name, "sub")


def table(headers, rows, fractions=None):
    fractions = fractions or [1 / len(headers)] * len(headers)
    content = [[p(escape(str(text)), "th") for text in headers]]
    content += [[p(escape(str(text)), "cell") for text in row] for row in rows]
    widget = Table(content, colWidths=[WIDTH * part for part in fractions], repeatRows=1, hAlign="LEFT")
    widget.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f8f1")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LINEBELOW", (0, 0), (-1, 0), 0.7, INK),
        ("LINEBELOW", (0, 1), (-1, -1), 0.35, LINE),
    ]))
    story.extend([widget, Spacer(1, 10)])


def figure(path, caption, height=None, crop=None):
    path = ROOT / path
    with PillowImage.open(path) as source:
        if crop:
            target = TMP / (path.stem + "-crop.png")
            source.crop(crop).save(target)
            path = target
            width_px, height_px = crop[2] - crop[0], crop[3] - crop[1]
        else:
            width_px, height_px = source.size
    figure_height = min(height or 350, WIDTH * height_px / width_px)
    figure_width = figure_height * width_px / height_px
    story.append(Image(str(path), width=figure_width, height=figure_height, hAlign="CENTER"))
    para(caption, "caption")


def code(text):
    story.append(Preformatted(text, STYLES["code"]))


class Flow(Flowable):
    def __init__(self, labels, descriptions):
        super().__init__()
        self.labels, self.descriptions = labels, descriptions
        self.width, self.height = WIDTH, 102

    def draw(self):
        count = len(self.labels)
        gap = 13
        box_width = (WIDTH - gap * (count - 1)) / count
        for index, label in enumerate(self.labels):
            x = index * (box_width + gap)
            self.canv.setFillColor(PALE)
            self.canv.setStrokeColor(LINE)
            self.canv.roundRect(x, 21, box_width, 70, 7, fill=1, stroke=1)
            self.canv.setFillColor(GREEN)
            self.canv.setFont("DengBold", 10)
            self.canv.drawCentredString(x + box_width / 2, 65, label)
            self.canv.setFillColor(MUTED)
            self.canv.setFont("Deng", 8)
            for line_index, line in enumerate(self.descriptions[index].split("\n")):
                self.canv.drawCentredString(x + box_width / 2, 47 - line_index * 12, line)
            if index < count - 1:
                self.canv.setStrokeColor(GREEN)
                self.canv.line(x + box_width + 2, 55, x + box_width + gap - 2, 55)
                self.canv.line(x + box_width + gap - 6, 58, x + box_width + gap - 2, 55)
                self.canv.line(x + box_width + gap - 6, 52, x + box_width + gap - 2, 55)


title("实验数据体检与可视化工作台", "第九届传智杯 · AI 创新应用挑战赛 / 项目技术文档")
para("LabLens", "hero")
para("让每一次处理，都能回到原始记录。", "sub")
para("从表格导入、问题定位到可撤销清洗、拟合图表与处理报告，构成面向实验教学的浏览器本地工作流。")
figure("docs/evidence/final-demo/final-chart.png", "图 1 · 正常界面实际导出的最终标定图。两组为合成教学观测，拟合使用整体 150 对数据。", height=256)
table(["原始记录", "处理后记录", "当前检查项"], [["163 条", "150 条", "13 → 0 项"]])
para(f"版本 1.0.0 · {DATE}（北京时间）", "small")
para('<link href="https://github.com/LoscX-X/Work-1" color="#718f56">源码与开发历史：github.com/LoscX-X/Work-1</link>', "small")
para("本文的界面、统计和文件来自实际实现与验证。教学样例的检查通过和高 R² 不构成真实实验效果的证明。", "small")

title("问题与产品边界", "01 · 场景选择与可验收目标")
para("本科实验课中，学生常在表格中整理传感器标定或重复测量结果。空值、错误文字、重复记录与极端读数混在一起时，直接绘图很难说明哪些观测被采用、处理过什么，以及能否重新得到同一结果。")
para("LabLens 将这一教学场景作为设计假设，使用明确标为合成的数据演示；没有声称开展过未实际发生的用户访谈或真实实验采集。")
sub("围绕一个数据集完成交付")
story.append(Flow(["导入", "体检", "清洗", "分析", "导出"], ["保留原值\n选择工作表", "定位行列\n说明依据", "先看影响\n确认或撤销", "明确观测\n对照原始值", "数据与报告\n配置可回放"]))
table(["用户要完成的事", "可观察的验收结果"], [
    ["知道问题在哪", "筛选问题后回到源记录与单元格，判定依据可查看。"],
    ["控制一次清洗", "预览列明修改格数和移除记录；取消保持原状态。"],
    ["解释图表来源", "字段、数据版本、参与与排除数量同时可见。"],
    ["交付可复核结果", "CSV、JSON、报告与配置指向同一处理结果。"],
], [0.3, 0.7])
sub("实现范围")
para("支持 CSV、TSV、XLSX，四类质量检查、可撤销操作、三类图表、普通最小二乘拟合和本地导出。当前工作区在内存中；恢复依赖原文件和已导出的清洗配置。")
para("产品界面只放实验数据工作流所需信息。比赛要求、录屏说明和 AI 开发证据作为独立提交材料提供。")

title("十分钟复现", "02 · 两种启动方式与确定的检查点")
sub("从源码启动")
code("git clone https://github.com/LoscX-X/Work-1.git lab-data-workbench\ncd lab-data-workbench\nnpm ci\nnpm run build\nnpm start")
para("需要 Node.js 22.18 或更新版本。默认地址为 http://127.0.0.1:4173/。首次安装 npm 依赖需要网络；构建后的解析和图表文件从本地提供。")
sub("从预构建包启动")
code("node --env-file-if-exists=.env server.mjs")
para("Windows 也可双击 Start-LabLens.cmd。预构建包已包含 dist，无需安装 npm 依赖。若要改端口，先复制环境模板，再修改 PORT；没有必填服务密钥。")
code("copy .env.example .env")
table(["检查点", "预期"], [["初始示例", "163 行、6 列、13 个检查项"], ["导入七步配置并确认", "150 行、0 个当前检查项"], ["压力 × 电压分析", "150 对观测；斜率约 1.87459；R² 约 0.99982"]], [0.38, 0.62])
para("七步配置位于 public/samples/sensor-cleaning-recipe.json。先使用同一原样例，再到追溯页导入配置；图表字段按上表选择。", "small")
para(f"干净本地 Git 副本已重新安装依赖并通过 check 与格式检查，Node {repro['node']}、npm {repro['npm']}，检查约 {repro['checkAndFormatSeconds']} 秒，依赖安装另报告 4 秒。正式服务启动成功；其独立浏览器复验受测试环境权限限制，未完成。", "small")

title("模块与数据流", "03 · 展示、交互状态、领域操作与外部格式分离")
story.append(Flow(["输入适配", "领域模型", "处理工作流", "结果交付"], ["File / CSV\nExcel 工作表", "Dataset\n解析与检查", "操作与历史\n用户确认", "React / 图表\n数据与报告"]))
table(["位置", "职责与边界"], [
    ["components / views", "呈现数据与意图；不在单元格渲染代码中实现统计规则。"],
    ["hooks", "组织导入、历史、设置、预览与导出；拒绝过期异步结果覆盖新工作区。"],
    ["lib/data-core.ts", "领域类型、有限数值/日期解析、类型建议、检查、统计和 CSV。"],
    ["features/cleaning", "纯数据操作、不可变历史、逐格来源、配置解析和完整回放。"],
    ["features/charts", "按同一口径收集观测，给出排除计数、统计与 ECharts 配置。"],
    ["features/reports", "以当前历史快照生成记录、图表图像和独立 HTML。"],
], [0.3, 0.7])
sub("核心数据约定")
para("Dataset 保存字段、稳定源记录编号、字符串值和文件来源；字段类型为 text / number / date。操作接收数据与显式参数，返回新数据、逐格变更、移除编号及说明。界面确认后才把操作结果放入历史。")
para("清洗、绘图和报告共享领域模型；处理前后比较采用同一套当前已确认字段类型，避免仅因类型解释不同而造成含混对照。")

title("导入与字段确认", "04 · 保留编号、精度与可追踪来源")
table(["输入", "实际处理"], [
    ["CSV / TSV", "Papa Parse 保留字符串和引号内容；UTF-8 严格解码失败后回退 GB18030。"],
    ["XLSX", "ExcelJS 读取工作簿，多个工作表由用户选择；公式只读缓存结果。"],
    ["编号与精度", "常见编号名称和前导零建议为文本；编号列简单 000 格式保留零，测量值保留底层精度。"],
    ["字段类型", "非空值达到 80% 可解析时建议为数值或日期；用户可以修改并进入历史。"],
], [0.23, 0.77])
figure("docs/screenshots/04-excel-precision.jpg", "图 2 · 真实导入另一份 XLSX 后变为 3 条记录。001、1.234567 及带逗号、引号和换行的文本保留。开发服务截图。", height=280)
para("导入时对原始文件字节计算 SHA-256，记录文件名、大小、导入时间、编码或工作表。CSV 源编号是包含表头且略过空白记录后的记录位置；Excel 使用工作表行号，不把跨行 CSV 记录编号说成物理行号。", "small")

title("检查依据与统计定义", "05 · 把规则和数据合理性判断分开")
table(["检查", "规则", "原样例"], [
    ["缺失值", "空值或仅含空白字符", "4 格"],
    ["格式错误", "在已确认数值/日期列中，非空值无法完整解析", "3 格"],
    ["额外重复", "当前全部字段值精确相同，保留首次记录", "3 条"],
    ["疑似异常", "有效数值至少 4 个且 IQR > 0，超出 Tukey 范围", "3 格"],
], [0.19, 0.65, 0.16])
sub("明确的数值口径")
code("position = (n - 1) * p\nIQR = Q3 - Q1\nrange = [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]\nquality = round(100 * (1 - affectedCells / totalCells))")
para("分位数按相邻有序观测线性插值；标准差采用 n−1 分母。格式错误拒绝 12mg、错误千位分隔和非有限数，不使用会吞掉尾部字符的宽松部分解析。日期校验拒绝不存在的日历日期。")
para("质量参考分对同一受影响单元格只计一次；额外重复行影响该行全部单元格。零个单元格时没有参考分。原样例有 13 个检查项、28 个唯一受影响单元格，因此参考分为 97。")
sub("规则的解释范围")
para("异常点默认只是提示，不自动删除。规则不能区分真实突变和录入错误；高参考分也不能证明实验真实性。类型建议需要人确认，尤其是样本少或格式混杂的列。")

title("预览与可撤销历史", "06 · 用户确认的是具体变化")
figure("docs/screenshots/07-whitespace-preview.jpg", "图 3 · 实际空白清理预览，裁取对话框以便阅读。引号显示首尾空白，修改前后不再被 HTML 空白合并遮蔽。开发服务截图。", height=340, crop=(425, 195, 1015, 705))
table(["阶段", "数据是否改变"], [["参数选择 / 预览", "只计算候选结果，不写入当前历史。"], ["取消", "当前数据和历史步数保持不变。"], ["确认", "结果与参数、逐格变更、移除编号一起提交。"], ["撤销 / 重做", "恢复已保留快照；新分支会截断旧重做分支。"]], [0.25, 0.75])
para("类型确认和人工单格修正也进入同一历史。无实际变化的操作不产生误导性步骤。预览、导出和已保存操作使用相同计算路径。", "small")

title("七步标定演示", "07 · 从原始输入到可复核的最终结果")
table(["步骤", "操作", "记录", "检查项"], [["0", "原样例", "163", "13"], ["1", "全部字段去首尾空白", "163", "13"], ["2", "移除额外重复", "160", "10"], ["3", "电压无效值置空", "160", "10"], ["4", "温度无效值置空", "160", "10"], ["5", "移除不完整记录", "153", "3"], ["6", "排除确认的电压异常", "151", "1"], ["7", "排除确认的温度异常", "150", "0"]], [0.12, 0.56, 0.16, 0.16])
para("上述七步均已从正常界面执行，并实际导出配置、CSV、逐格处理记录、HTML 与图表。无效值置空后，问题由格式错误变成缺失，因此检查项不会立即减少；移除缺失记录后数量才改变。")
sub("保存的核查证据")
para("docs/evidence/final-demo/ 保存实际 UI 预览与结果、各步时间、下载文件及独立校验。重建的最终结果与配置指纹一致；没有用预先硬编码的界面数字代替计算。")
code("python tools/verify_export_evidence.py --scenario final")
para("演示文件按固定种子 20261117 生成，基础关系为 sensor_mV = 8.7 + 1.876 × pressure_kPa + Normal(0, 0.7)。极端值和其它问题均为明确注入的教学情况；不声称采集过真实标定实验。", "small")

title("分析口径与前后对照", "08 · 每个拟合结果都对应明确的观测集合")
figure("docs/evidence/final-demo/final-chart.png", "图 4 · 当前结果实际导出的 PNG；A/B 组分别着色，虚线为全部纳入观测的整体 OLS 拟合。", height=267)
table(["指标", "原始值", "七步当前结果"], [["有效观测对", "159", "150"], ["斜率", f"{ORIGINAL['slope']:.5f}", f"{FIT['slope']:.5f}"], ["截距", f"{ORIGINAL['intercept']:.5f}", f"{FIT['intercept']:.5f}"], ["R²", f"{ORIGINAL['r2']:.5f}", f"{FIT['r2']:.5f}"]], [0.3, 0.35, 0.35])
para("图表可切换散点、趋势和直方图，配置 X/Y 与分组字段。有效观测、缺失、格式错误和被排除填充值的计数互斥列明。直方图只需要所选数值字段，不要求另一轴完整。")
para("普通最小二乘用于数值 X/Y；常量 X、无有效观测或不可表示的结果不输出拟合，常量 Y 的 R² 留空。R² 描述当前纳入集合的线性程度，不能单独决定删点或证明模型有效。", "small")

title("填充值与人工修正来源", "09 · 另一条独立验证路径，不混入七步演示")
figure("docs/screenshots/02-imputation-analysis.jpg", "图 5 · 去重后以电压中位数填充两格的真实界面。该路径保留 160 行，区别于七步演示的 150 行。开发服务截图。", height=285)
table(["分析策略", "参与观测", "排除说明"], [["默认排除填充值", "156 对", "2 个格式错误 + 2 个填充值"], ["允许填充值参与", "158 对", "2 个格式错误"]], [0.33, 0.2, 0.47])
para("源记录 #14 与 #49 的电压空值填为 109.5095，值与来源进入操作记录。来源可区分填充、人工修改、清空和格式化；后续格式化不会抹掉已有填充来源。")
para("双击单格修正会先显示前后值；确认后表格显示“改”标记，并可撤销。原始值视图只读，避免把对照数据悄悄改成当前结果。")
para("独立 Python 对该路径重算 156 对观测，斜率 1.789556189829693，R² 0.555055689559629，与实际导出文件一致。", "small")

title("配置回放与结果导出", "10 · 完整试运行通过后才替换工作区")
story.append(Flow(["校验源文件", "试运行", "核对结果", "确认应用"], ["SHA-256\n工作表与结构", "独立历史\n全部操作", "行数与指纹\n算法版本", "一次替换\n保留回放信息"]))
table(["文件", "保留的内容"], [["CSV", "当前结果全表与原字段字符串值。"], ["完整处理 JSON", "来源、字段、前后问题计数、逐格变更、移除编号、图表设置与统计。"], ["清洗配置 JSON", "生效操作前缀、顺序、参数、源 SHA-256、版本和结果指纹。"], ["HTML 报告", "内嵌图表、字段统计、流程、前 20 条预览与完整记录。"], ["PNG", "当前选中字段、分组和数据版本的图表。"]], [0.27, 0.73])
para("配置先在独立状态中执行；源文件、工作表、格式、操作或最终指纹错误都会拒绝，不留下部分应用结果。异步回放还核对工作区版本，避免确认前的新操作被过期结果覆盖。")
para("指纹用于识别字节和数据结果的一致性，不证明配置作者身份或实验真实性。清洗配置不保存图表设置；图表口径在完整处理记录和报告中保留。")
para("报告生成使用点击导出时的历史快照，并将图表编码为内嵌 PNG。实际报告已重新打开，文件没有外部脚本与图像链接。", "small")

title("AI 意图控制策略", "11 · 从用户目标到阶段任务，再到实际验收")
para("参赛者确定主题、时间约束、网页形式、工程化与拆分方向，AI 承担主要实现及验证。具体阶段提示由 AI 根据委托整理，并实际用于后续实现；它们没有被冒充为用户逐条输入的聊天。")
sub("第一轮：导入与体检")
para("任务约束保留原始值、稳定源记录和 001 编号，分别定位空值、格式错误、额外重复及疑似异常。验收使用同一导入路径，并从实际 XLSX 选择工作表核对。")
sub("第二轮：可撤销清洗")
para("任务约束操作为纯函数，预览不改输入，确认才提交；参数、逐格变更与移除编号进入记录。验收覆盖取消、撤销、重做和分支失效。")
sub("第三轮：分析与可复现交付")
para("任务明确参与/排除口径、填充值来源、当前生效前缀、原子回放、源文件与结果指纹。验收要求实际下载 CSV、JSON、HTML、PNG 后交叉核对。")
table(["上下文组织", "实现中的具体作用"], [["统一领域模型", "避免页面、算法、图表和导出各自解释一份数据。"], ["阶段验收条件", "区分计划、代码存在、算法用例和真实浏览器行为。"], ["失败与修复记录", "暴露失败后修正实现或测试依据，不用虚构成功替代。"], ["范围约束", "保持实验数据主线，材料只涉及本项目与本次比赛。"]], [0.29, 0.71])
para("原文与对应时间见 docs/ai/actual-dialogue-excerpts.json / .md；阶段提示与真实结果见 01、02、03 开发记录。对话文件明确标为摘录，不声称是完整会话。", "small")

title("实际迭代与 Git 演进", "12 · 实现、修复与证据相对应")
table(["提交", "核心变化"], [["6c03026", "定义原始范围、本地入口和首轮任务。"], ["6656be2", "类型化导入、解释性检查核心、样例和算法验证。"], ["54efffb", "模块化 React 界面及真实 CSV / Excel 导入。"], ["53aa509", "清洗预览、不可变历史、撤销与重做。"], ["a6e78b7", "分析口径、来源、报告、结果核对与配置回放。"], ["889afbd", "空白边界预览、最终演示配置与预构建启动入口。"]], [0.24, 0.76])
sub("真实修复示例")
para("首轮六项用例中两项失败：一项是日期规范化实现错误，另一项是 IQR 测试数据不满足预期阈值。分别修正实现与测试依据后通过，记录没有把修改测试预期说成产品功能修复。")
para("后续大数值测试暴露 1e308 均值溢出。实现改用缩放计算，分位数使用加权端点，回归与分箱覆盖有限大数。重复表头后缀冲突也先由测试复现，再使用唯一名称集合修复。")
para("最终演示发现空白预览因 HTML 合并而看起来前后相同，随后只调整预览表示，使用引号保留边界，原始数据和清洗算法保持同一语义。")
code("git log --oneline --reverse\ngit show 53aa509\ngit show a6e78b7 -- src/lib/data-core.ts")

title("验证证据与覆盖边界", "13 · 每种验证只证明实际覆盖的内容")
table(["层次", "已完成", "证据"], [["算法与构建", "25 项测试、类型检查、构建、格式检查", "tests/ 与干净副本检查记录"], ["真实界面", "文件选择、定位、预览、取消、撤销、填充、回放、导出", "开发服务正常入口与截图"], ["保存文件", "重建 CSV、独立 OLS、配置指纹、JSON/HTML 一致", "两种场景的实际下载文件"], ["干净副本", "独立依赖安装、Node 22.19 检查、正式服务启动", "docs/evidence/reproduction.json"]], [0.2, 0.49, 0.31])
sub("对实际导出文件独立检查")
para("标准库 Python 从原文件按逐格变更与移除记录重建结果，逐项比较 CSV；重新计算普通最小二乘，并核对 HTML 中的完整记录与 JSON。最终 150 行的配置结果指纹通过，两个场景的报告内嵌 PNG 均为 1800×900。")
code("python tools/verify_export_evidence.py\npython tools/verify_export_evidence.py --scenario final")
sub("尚未覆盖的部分")
para("正式构建已在干净副本启动；独立浏览器复验受测试环境访问权限限制，未完成。本文真实浏览器流程证据来自开发服务，未将它写成正式服务的实测结果。")
para("未完成多浏览器、所有移动设备、所有编码/Excel 组合及超大文件压力验证。未将算法单元测试称作完整端到端测试。", "small")

title("工程取舍与使用边界", "14 · 让实现复杂度与本科实验表格场景相称")
table(["选择", "理由与边界"], [["浏览器本地处理", "无需服务密钥；原文件不上传应用后端。适合当前教学短表，受设备内存和主线程计算约束。"], ["不可变快照", "撤销/重做语义清楚，便于精确验证；长操作链会增加内存占用。"], ["显式确认", "删除和填充前先看实际影响；用户仍需对实验合理性负责。"], ["本地固定库", "构建后可离线加载，版本和哈希可核对；更新需维护随包文件及许可。"], ["内存工作区", "简化当前单人流程；刷新前保存配置，恢复时重新导入同一原文件。"]], [0.26, 0.74])
sub("输入与统计限制")
para("不读取旧版 XLS，不执行 Excel 公式。未缓存的公式需要先重新计算并保存。编号只适配简单全零显示格式；其它测量字段使用底层完整值，不复刻所有 Excel 显示规则。")
para("CSV 没有列类型信息；外部软件自动把 001 转为数值时，应按文本导入。分布、拟合和异常规则依赖已确认类型和选择的观测集合。")
sub("复现和交付的一致性")
para("使用锁文件安装依赖；保留 vendor 哈希、CSV 固定字节、三轮任务和真实提交。项目提交包保留源码、预构建文件、许可、文档与证据；运行本身不依赖 PDF 作者工具。")
para("后续改进以实际使用反馈和失败场景为依据，不将未实现的云端同步、自动实验判定等能力列为当前成果。", "small")

title("依赖来源与材料索引", "15 · 原创实现与实际第三方使用范围")
table(["依赖", "版本 / 许可", "实际用途"], [["React / ReactDOM", "19.3.1 / MIT", "界面与状态渲染"], ["Apache ECharts", "6.0.0 / Apache-2.0 等随包条款", "图表交互和图像导出"], ["Papa Parse", "5.5.3 / MIT", "CSV / TSV 解析"], ["ExcelJS", "4.4.0 / MIT", "XLSX 读取"], ["TypeScript / Vite", "7.0.2 Apache-2.0 / 8.3.8 MIT", "类型检查与构建"], ["Prettier", "3.10.1 / MIT", "源码格式检查"]], [0.3, 0.34, 0.36])
para("展示组件由本项目编写；设计探索参考 Arc 的界面组织方向，没有导入 TKCode.Arc 或 Arc UI 组件源码。原创数据检查、清洗、来源与回放逻辑位于本项目领域模块。")
para("完整许可、NOTICE、包地址与已核对范围见 THIRD_PARTY_NOTICES.md、licenses/ 和 public/vendor/manifest.json。开发工具的子依赖以随包声明为准，不把直接依赖清单说成全部间接依赖法律审计。", "small")
sub("提交材料索引")
table(["位置", "内容"], [["README.md", "启动、环境、检查点和边界"], ["docs/ai/", "三轮核心任务、实际结果与公开对话摘录"], ["docs/validation.md", "真实验证、证据与缺口"], ["docs/recording-guide.md", "约 7 分钟录屏步骤与讲稿"], ["docs/SUBMISSION.md", "本届比赛材料与最终提交核对"]], [0.4, 0.6])
para("本文为本作品技术说明。实际 MP4 由参赛者录制，比赛账户与上传成功状态需在对应平台核实。", "small")


def decorate(canvas, doc):
    page = canvas.getPageNumber()
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(45, A4[1] - 34, A4[0] - 45, A4[1] - 34)
    canvas.setFillColor(GREEN)
    canvas.setFont("DengBold", 8)
    canvas.drawString(45, A4[1] - 25, "LabLens")
    canvas.setFillColor(MUTED)
    canvas.setFont("Deng", 8)
    canvas.drawRightString(A4[0] - 45, A4[1] - 25, "项目技术文档 / v1.0.0")
    canvas.line(45, 34, A4[0] - 45, 34)
    canvas.drawString(45, 21, "实验数据体检与可视化工作台")
    canvas.setFont("Mono", 8)
    canvas.drawRightString(A4[0] - 45, 21, f"{page:02d} / 16")
    canvas.restoreState()


doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=45, leftMargin=45, topMargin=53, bottomMargin=49, title="LabLens 实验数据体检与可视化工作台 · 技术文档", author="LabLens", subject="AI 创新应用挑战赛项目技术说明", pageCompression=1)
doc.build(story, onFirstPage=decorate, onLaterPages=decorate)
(TMP / "page-plan.json").write_text(json.dumps(TITLES, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"output": str(OUT), "planned_pages": len(TITLES), "bytes": OUT.stat().st_size}))
