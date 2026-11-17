"""Package the clean Git tree and freshly built runtime for competition review.

Run npm run build first. Uses only Python's standard library and Git. The ZIP
contains project files, dist, an offline Git bundle, and per-file SHA-256 sums.
No node_modules, local environment file, session log, or untracked file is read.
"""

from pathlib import Path, PurePosixPath
from datetime import datetime, timezone
import hashlib
import io
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "output" / "release"


def git(*arguments):
    return subprocess.check_output(["git", *arguments], cwd=ROOT)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    if git("status", "--porcelain").strip():
        raise SystemExit("Commit project changes before packaging so the source and history agree.")
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    version = package["version"]
    commit = git("rev-parse", "HEAD").decode().strip()
    entry = ROOT / "dist" / "index.html"
    if not entry.exists():
        raise SystemExit("Run npm run build first.")
    inputs = [path for folder in [ROOT / "src", ROOT / "public"] for path in folder.rglob("*") if path.is_file()]
    inputs += [ROOT / name for name in ["index.html", "package.json", "package-lock.json", "vite.config.ts", "tsconfig.json"]]
    newest_input = max(path.stat().st_mtime for path in inputs)
    if entry.stat().st_mtime < newest_input:
        raise SystemExit("The build is older than project inputs. Run npm run build again.")
    with zipfile.ZipFile(io.BytesIO(git("archive", "--format=zip", "HEAD"))) as archive:
        payload = {name: archive.read(name) for name in archive.namelist() if not name.endswith("/")}
    for path in (ROOT / "dist").rglob("*"):
        if path.is_file():
            payload[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    assert ".env" not in payload
    assert "docs/past-award-research.md" not in payload
    assert not any(name.startswith(("node_modules/", ".git/", "tmp/", ".cache/", "output/release/")) for name in payload)

    # Verify actual offline entry references without making a blocked browser request.
    html = payload["dist/index.html"].decode("utf-8")
    assets = re.findall(r'(?:src|href)="([^"]+)"', html)
    for source in assets:
        assert not source.startswith(("http:", "https:", "//")), source
        reference = PurePosixPath("dist") / source
        assert ".." not in reference.parts and reference.as_posix() in payload, source
    vendors = json.loads(payload["public/vendor/manifest.json"].decode("utf-8"))
    for item in vendors:
        for folder in ["public/vendor", "dist/vendor"]:
            assert digest(payload[f"{folder}/{item['file']}"]) == item["sha256"], item["name"]
    sample = json.loads(payload["public/samples/manifest.json"].decode("utf-8"))
    for folder in ["public/samples", "dist/samples"]:
        assert digest(payload[f"{folder}/sensor-calibration.csv"]) == sample["csv_sha256"]
    pdf_record = json.loads(payload["docs/evidence/pdf-validation.json"].decode("utf-8-sig"))
    assert pdf_record["pages"] == 16
    assert digest(payload["output/pdf/LabLens-Technical-Documentation.pdf"]) == pdf_record["sha256"]

    DESTINATION.mkdir(parents=True, exist_ok=True)
    bundle = DESTINATION / "LabLens-history.bundle"
    subprocess.run(["git", "bundle", "create", str(bundle), "main"], cwd=ROOT, check=True, capture_output=True)
    subprocess.run(["git", "bundle", "verify", str(bundle)], cwd=ROOT, check=True, capture_output=True)
    heads = git("bundle", "list-heads", str(bundle)).decode("utf-8")
    assert f"{commit} refs/heads/main" in heads
    payload["LabLens-history.bundle"] = bundle.read_bytes()
    metadata = {"project": "LabLens", "version": version, "sourceCommit": commit, "createdAt": datetime.now(timezone.utc).isoformat(), "source": "Clean Git archive plus freshly built dist", "pdfPages": 16, "runtime": "Node.js >=22.18; Start-LabLens.cmd or npm start", "offlineHistoryRestore": "git clone --branch main LabLens-history.bundle restored-source", "video": "Participant records the video using docs/recording-guide.md", "validationLimits": "Browser access settings blocked the revised interface recheck. Saved browser screenshots and exports are from v1.0.0. See docs/validation.md."}
    payload["release-info.json"] = json.dumps(metadata, ensure_ascii=False, indent=2).encode("utf-8")
    sums = {name: digest(data) for name, data in sorted(payload.items())}
    payload["SHA256SUMS.txt"] = "".join(f"{value}  {name}\n" for name, value in sums.items()).encode("utf-8")
    output = DESTINATION / f"LabLens-v{version}-submission.zip"
    prefix = f"LabLens-v{version}/"
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(payload.items()):
            archive.writestr(prefix + name, data)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(payload)
        for name, expected in sums.items():
            assert digest(archive.read(prefix + name)) == expected, name
    bundle.unlink()  # The single generated bundle file is already inside the verified ZIP.
    summary = {**metadata, "zip": output.name, "zipBytes": output.stat().st_size, "zipSha256": digest(output.read_bytes()), "payloadFiles": len(payload), "verifiedChecksums": len(sums), "staticEntryReferences": assets, "vendorFilesChecked": len(vendors) * 2, "gitBundleVerified": True, "zipCrcVerified": True}
    (DESTINATION / "release-manifest.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    (DESTINATION / "SHA256SUMS.txt").write_text(f"{summary['zipSha256']}  {output.name}\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
