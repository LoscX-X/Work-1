"""Export explicitly selected public project messages from a local Codex log.

The author supplies --source; no local session or credential is distributed.
Reasoning, system/developer messages, unrelated discussion and tool payloads are
never selected. The output clearly identifies itself as excerpts.
"""

from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
CASES = [
    ("01-import-audit", "导入、类型确认与问题定位", "6656be2 / 54efffb", [353, 359, 376, 384, 453, 503, 530, 543, 556, 561, 608, 622, 626, 641, 743, 747, 765, 789, 793, 798, 819, 899]),
    ("02-cleaning-history", "可预览清洗与撤销重做", "53aa509", [743, 789, 793, 798, 899, 1082]),
    ("03-visualization-replay", "分析口径、配置回放与报告核查", "a6e78b7", [1394, 1472, 1481, 1521, 1599, 1665, 1701, 1729, 1832, 1882]),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()
    source = args.source.read_bytes()
    entries = [json.loads(line) for line in source.decode("utf-8").splitlines()]
    output = ROOT / "docs" / "ai"
    cases = []
    for stem, title, commits, indices in CASES:
        messages = []
        for index in indices:
            entry = entries[index]
            item = entry.get("payload", {})
            assert entry["type"] == "response_item" and item["type"] == "message"
            assert item["role"] in ["user", "assistant"]
            if item["role"] == "assistant":
                assert item.get("phase") in ["commentary", "final_answer"]
            text = "\n".join(part["text"] for part in item["content"] if part.get("type") in ["input_text", "output_text"])
            assert text and "\ufffd" not in text
            source_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
            representation = "original public message text"
            if text.lstrip().startswith("<send_user_message_question_reply>"):
                replies = json.loads(text.split(">", 1)[1].split("</send_user_message_question_reply>", 1)[0])
                text = "\n\n".join(f"界面问题：{reply['question']}\n用户回答：{reply['answer']}" for reply in replies)
                representation = "exact question and answer field strings; client routing metadata omitted"
            messages.append({"timestamp": entry["timestamp"], "role": item["role"], "source_line": index + 1, "source_message_sha256": source_hash, "representation": representation, "text": text})
        cases.append({"id": stem, "title": title, "task_record": f"{stem}.md", "commits": commits, "messages": messages})
    record = {"format": "lablens.actual-dialogue-excerpts", "version": 1, "exportedAt": datetime.now(timezone.utc).isoformat(), "sourceSnapshotSha256": hashlib.sha256(source).hexdigest(), "scope": "与项目开发有关的公开用户/助手消息摘录；不是完整聊天导出。结构化界面回复保留原始问题与答案，略去客户端路由标识。任务提示由 AI 按用户委托整理，保存在对应任务文件中，不冒充用户逐条输入。未包含隐藏推理、系统指令、凭据及无关聊天。", "cases": cases}
    (output / "actual-dialogue-excerpts.json").write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown = ["# 真实 AI 协作对话摘录", "", record["scope"], "", "本文件保留选中消息的原文和时间。三轮开发任务提示、变更和验证分别记录在对应 Markdown 中，可与 Git 提交核对。对话摘录不代表所有构建步骤，浏览器和导出验证另见 docs/validation.md。", ""]
    for case in cases:
        markdown.extend([f"## {case['title']}", "", f"任务记录：[{case['id']}]({case['task_record']})；对应提交：`{case['commits']}`。", ""])
        for message in case["messages"]:
            who = "用户" if message["role"] == "user" else "助手"
            markdown.extend([f"### {message['timestamp']} · {who}", "", "\n".join("> " + line for line in message["text"].splitlines()), ""])
    (output / "actual-dialogue-excerpts.md").write_text("\n".join(markdown), encoding="utf-8")
    print(json.dumps({"cases": len(cases), "selected_messages_including_shared_context": sum(len(case["messages"]) for case in cases), "output": "docs/ai/actual-dialogue-excerpts.json"}))


if __name__ == "__main__":
    main()
