"""Cross-check actual browser downloads, independently of the React state.

Run with Python 3.10+ after copying the documented downloads to docs/evidence/browser.
Uses only the standard library. It verifies the recorded two-step QA scenario.
"""

from pathlib import Path
import base64
import csv
import hashlib
import html
import io
import json
import math
import re
import struct

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "docs" / "evidence" / "browser"


def read_json(name):
    return json.loads((DESTINATION / name).read_text(encoding="utf-8-sig"))


audit = read_json("imputation-audit.json")
recipe = read_json("imputation-recipe.json")
source_bytes = (ROOT / "public/samples/sensor-calibration.csv").read_bytes()
assert hashlib.sha256(source_bytes).hexdigest() == audit["source"]["sha256"] == recipe["source"]["sha256"]
source = list(csv.reader(io.StringIO(source_bytes.decode("utf-8-sig"))))
result = list(csv.reader((DESTINATION / "imputation-result.csv").open(encoding="utf-8-sig", newline="")))
assert source[0] == result[0] == [column["name"] for column in audit["schema"]]
rows = {index: row[:] for index, row in enumerate(source[1:], 2)}
for operation in audit["operations"]:
    for row_id in operation["removedSourceRecordIds"]:
        del rows[row_id]
    for cell in operation["changedCells"]:
        assert rows[cell["rowId"]][cell["columnId"]] == cell["before"]
        rows[cell["rowId"]][cell["columnId"]] = cell["after"]
assert list(rows.values()) == result[1:]
assert len(result) - 1 == audit["after"]["rows"] == recipe["expected"]["rows"] == 160
assert len(audit["operations"]) == len(recipe["operations"]) == 2
assert sum(audit["after"]["issueCounts"].values()) == 8
imputed = {entry["cell"] for entry in audit["lineage"] if entry["origin"] == "imputed"}
assert imputed == {"14:3", "49:3"}
pairs = []
for row_id, row in rows.items():
    if f"{row_id}:3" in imputed:
        continue
    try:
        pairs.append((float(row[2]), float(row[3])))
    except ValueError:
        pass
assert len(pairs) == audit["analysis"]["used"] == 156
mean_x = math.fsum(x for x, y in pairs) / len(pairs)
mean_y = math.fsum(y for x, y in pairs) / len(pairs)
variance_x = math.fsum((x - mean_x) ** 2 for x, y in pairs)
variance_y = math.fsum((y - mean_y) ** 2 for x, y in pairs)
covariance = math.fsum((x - mean_x) * (y - mean_y) for x, y in pairs)
slope = covariance / variance_x
intercept = mean_y - slope * mean_x
r2 = covariance ** 2 / variance_x / variance_y
for key, expected in [("slope", slope), ("intercept", intercept), ("r2", r2)]:
    assert math.isclose(audit["analysis"]["regression"][key], expected, rel_tol=1e-10)

report = (DESTINATION / "imputation-report.html").read_text(encoding="utf-8")
report_record = json.loads(html.unescape(re.search(r"<pre>(.*?)</pre>", report, re.S).group(1)))
for key in ["source", "schema", "before", "after", "analysis", "operations", "lineage", "replay", "methods"]:
    assert report_record[key] == audit[key], key
image_payload = re.search(r'src="data:image/png;base64,([^"]+)"', report).group(1)
report_png = base64.b64decode(image_payload)
assert report_png[:8] == b"\x89PNG\r\n\x1a\n"
assert struct.unpack(">II", report_png[16:24]) == (1800, 900)
assert not re.search(r"<script\b|(?:src|href)=[\"']https?://", report, re.I)
downloaded_png = (DESTINATION / "imputation-chart.png").read_bytes()
assert downloaded_png[:8] == b"\x89PNG\r\n\x1a\n"

summary = {
    "scenario": "Actual browser exports after deduplication and median imputation",
    "source_sha256": audit["source"]["sha256"],
    "rows": 160,
    "active_operations": 2,
    "included_observations": len(pairs),
    "imputed_cells": sorted(imputed),
    "independently_calculated_fit": {"slope": slope, "intercept": intercept, "r2": r2},
    "report_chart_dimensions": [1800, 900],
    "downloaded_chart_dimensions": list(struct.unpack(">II", downloaded_png[16:24])),
    "verified": ["source file hash", "CSV against complete cell changes", "recipe row count", "independent OLS", "HTML against audit JSON", "embedded PNG", "downloaded PNG"],
    "limits": "This script checks the saved two-step scenario. Browser interactions are documented separately; this is not a browser runner.",
}
(DESTINATION / "verification.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
