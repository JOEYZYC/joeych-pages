"""Derive licensed site-wide WOFF subsets; --check verifies frozen-content coverage.

Requires existing fontTools, not Brotli. Reads original fonts without modifying them.
"""

import argparse
import hashlib
import json
import platform
import sys
import unicodedata
from pathlib import Path

import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "Astro/src/assets/fonts/home"
INPUT_HASH_NORMALIZATION = "utf8-lf"
TARGET_BYTES = 1024 * 1024
APPROVED_COPY = "充满热情的电子工程师\n从电路到代码，我喜欢把好奇心变成看得见的作品。\n让好奇心，有一个去处。"
EXTRA_CHARACTERS = "\u00a0·–—‘’“”…←↑→↓"
SOURCES = {
    "maple": {
        "path": "C:/Users/JOEYCH/AppData/Local/Microsoft/Windows/Fonts/MapleMono-NF-CN-SemiBold.ttf",
        "sha256": "9b8af53af2fa6f07ccd47a1eed108ac2999f4a6f7698c39f4a7edd5b5b053a49",
        "upstream": "https://github.com/subframe7536/maple-font/releases/tag/v7.9",
        "license_url": "https://raw.githubusercontent.com/subframe7536/maple-font/v7/OFL.txt",
        "license_file": "maple-OFL.txt",
        "copyright_marker": "Copyright 2022 The Maple Mono Project Authors",
        "reserved_font_names": [],
        "family": "Home Maple Subset",
    },
    "noto": {
        "path": "C:/Windows/Fonts/NotoSansSC-VF.ttf",
        "sha256": "763146584cf0710223441356b4395e279021b0806c196614377a7a0174ae074a",
        "upstream": "https://github.com/google/fonts/tree/main/ofl/notosanssc",
        "license_url": "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt",
        "license_file": "noto-OFL.txt",
        "copyright_marker": "2014-2021 Adobe",
        "reserved_font_names": ["Source"],
        "family": "Home Noto Subset",
    },
}


def ensure(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def names(font, number):
    return sorted({record.toUnicode() for record in font["name"].names if record.nameID == number})


def normalized_text(path):
    return path.read_bytes().decode("utf-8").replace("\r\n", "\n").replace("\r", "\n")


def input_sort_key(relative_path):
    relative = relative_path.as_posix()
    return relative.casefold(), relative


def inventory():
    paths = {path for folder in ["site", "home", "about", "projects", "tech-stack"]
             for path in (ROOT / "Profile" / folder).rglob("*")
             if path.suffix in {".yml", ".yaml"} and path.is_file()}
    paths.update(path for path in (ROOT / "Astro/src").rglob("*")
                 if path.suffix in {".astro", ".ts", ".css"} and path.is_file())
    paths.update(OUTPUT / name for name in ["NOTICE.txt", "maple-OFL.txt", "noto-OFL.txt"])
    files = []
    texts = []
    for path in sorted(paths, key=lambda path: input_sort_key(path.relative_to(ROOT))):
        ensure(not path.is_symlink(), f"Unexpected symlink input: {path}")
        text = normalized_text(path)
        files.append({"path": path.relative_to(ROOT).as_posix(),
                      "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest()})
        texts.append(text)
    text = "".join(texts)
    characters = set(text + APPROVED_COPY + EXTRA_CHARACTERS)
    characters.update(chr(number) for number in range(32, 127))
    characters = sorted(char for char in characters if not unicodedata.category(char).startswith("C"))
    return {
        "scope": "LF-normalized UTF-8 of all public Profile YAML in site/home/about/projects/tech-stack, all Astro src .astro/.ts/.css, and distributed font notices; ASCII 32-126; approved copy; explicit punctuation. No YAML facts are parsed. Generated inventories and font binaries are excluded.",
        "inputHashNormalization": INPUT_HASH_NORMALIZATION,
        "inputs": files,
        "approved_copy": APPROVED_COPY,
        "extra_characters": EXTRA_CHARACTERS,
        "characters": "".join(characters),
        "codepoints": [f"U+{ord(char):04X}" for char in characters],
        "count": len(characters),
    }


def verify_font(path, required, weight, family, license_text):
    ensure(path.read_bytes()[:4] == b"wOFF", f"Not WOFF1: {path.name}")
    with TTFont(path) as font:
        cmap = font.getBestCmap()
        missing = sorted(required - set(cmap))
        ensure(not missing, f"Missing glyphs in {path.name}: {missing}")
        ensure(not any(unicodedata.category(chr(point)) == "Co" for point in cmap), "Unexpected private-use glyph")
        ensure("fvar" not in font, "Expected a static weight, not a variable font")
        ensure(font["OS/2"].usWeightClass == weight, f"Wrong weight: {path.name}")
        ensure(font["OS/2"].fsType == 0, "Unexpected embedding restrictions")
        ensure(names(font, 1) == [family] and names(font, 16) == [family], "Unexpected primary family")
        ensure(all("Source" not in value for value in names(font, 1) + names(font, 16)), "Reserved primary name")
        ensure(any(license_text in value for value in names(font, 13)), "Full OFL notice missing from font")
        return {"file": path.name, "sha256": sha256(path), "bytes": path.stat().st_size,
                "signature": "wOFF", "family": family, "weight": weight,
                "style": "normal", "static": True, "required_codepoints": len(required),
                "cmap_codepoints": len(cmap), "missing_codepoints": [],
                "copyright": names(font, 0), "version": names(font, 5)}


def derive(source, weight, required, license_text):
    path = Path(source["path"])
    with TTFont(path, recalcTimestamp=False) as font:
        original_names = {str(number): names(font, number) for number in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 14, 16, 17]}
        ensure(any(source["copyright_marker"] in value for value in names(font, 0)), "Copyright mismatch")
        ensure(any("SIL Open Font License" in value for value in names(font, 13)), "OFL metadata missing")
        ensure(not (required - set(font.getBestCmap())), f"Original font lacks required glyphs: {path.name}")
        options = subset.Options()
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.name_legacy = True
        options.layout_features = ["*"]
        options.notdef_outline = True
        options.recommended_glyphs = True
        options.drop_tables += ["meta"]
        worker = subset.Subsetter(options=options)
        worker.populate(unicodes=required)
        worker.subset(font)
        if "fvar" in font:
            instantiateVariableFont(font, {"wght": weight}, inplace=True)
        ensure(font["OS/2"].usWeightClass == weight, "Source/instantiated weight mismatch")
        family = source["family"]
        style = "Regular" if weight == 400 else "SemiBold"
        primary = {1: family, 2: style, 3: f"{family};{style};HomeSubset",
                   4: f"{family} {style}", 6: f"{family.replace(' ', '')}-{style}",
                   16: family, 17: style, 18: f"{family} {style}", 21: family, 22: style}
        for number, value in primary.items():
            font["name"].removeNames(nameID=number)
            font["name"].setName(value, number, 3, 1, 0x409)
        original_license = "\n".join(original_names["13"])
        font["name"].removeNames(nameID=13)
        font["name"].setName(original_license + "\n\n" + license_text, 13, 3, 1, 0x409)
        font["name"].setName("Modified Version: Site-wide content subset; static weight; WOFF1. Original authors do not endorse this derivative.", 10, 3, 1, 0x409)
        font.flavor = "woff"
        target = OUTPUT / f"home-{'maple' if 'Maple' in family else 'noto'}-{weight}.woff"
        font.save(target)
    asset = verify_font(target, required, weight, family, license_text)
    ensure(asset["copyright"] == original_names["0"], "Original copyright changed")
    return asset, original_names


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Read-only check of current inputs, artifacts, and metadata")
    arguments = parser.parse_args()
    current = inventory()
    required = {ord(char) for char in current["characters"]}
    if arguments.check:
        recorded = json.loads((OUTPUT / "glyphs.json").read_text(encoding="utf-8"))
        ensure(recorded == current, "Content/glyph inventory changed; regenerate subsets after writer freeze")
        manifest = json.loads((OUTPUT / "provenance.json").read_text(encoding="utf-8"))
        ensure(manifest["inputHashNormalization"] == INPUT_HASH_NORMALIZATION, "Unexpected input hash normalization")
        ensure([asset["file"] for asset in manifest["assets"]] ==
               ["home-maple-600.woff", "home-noto-400.woff", "home-noto-600.woff"], "Unexpected font asset set")
        for asset in manifest["assets"]:
            license_file = "maple-OFL.txt" if "maple" in asset["file"] else "noto-OFL.txt"
            verified = verify_font(OUTPUT / asset["file"], required, asset["weight"], asset["family"], (OUTPUT / license_file).read_text(encoding="utf-8"))
            ensure(verified == asset, f"Artifact differs from manifest: {asset['file']}")
        ensure(sum(asset["bytes"] for asset in manifest["assets"]) == manifest["total_bytes"], "Incorrect total bytes")
        ensure(manifest["total_bytes"] < TARGET_BYTES, "Subset fonts exceed the existing 1 MiB limit")
        print(json.dumps({"check": "passed", "glyphs": len(required), "assets": len(manifest["assets"]), "total_bytes": manifest["total_bytes"]}))
        return 0
    for source in SOURCES.values():
        ensure(sha256(Path(source["path"])) == source["sha256"], "Original font hash mismatch")
        license_text = (OUTPUT / source["license_file"]).read_text(encoding="utf-8")
        ensure(source["copyright_marker"] in license_text and "SIL OPEN FONT LICENSE Version 1.1" in license_text, "License notice mismatch")
    assets = []
    sources = {}
    for key, weights in [("maple", [600]), ("noto", [400, 600])]:
        source = SOURCES[key]
        license_text = (OUTPUT / source["license_file"]).read_text(encoding="utf-8")
        for weight in weights:
            asset, original_names = derive(source, weight, required, license_text)
            assets.append(asset)
        sources[key] = {**source, "bytes": Path(source["path"]).stat().st_size, "original_names": original_names,
                        "license_sha256": sha256(OUTPUT / source["license_file"])}
        ensure(sha256(Path(source["path"])) == source["sha256"], "Original font changed during generation")
    ensure(inventory() == current, "Content changed during generation; retry only after writer freeze")
    ensure(sum(asset["bytes"] for asset in assets) < TARGET_BYTES, "Subset fonts exceed the existing 1 MiB limit")
    manifest = {"license": "OFL-1.1", "format": "WOFF1 (zlib)", "modified_version": True,
                "generation_command": "python Astro/scripts/subset-home-fonts.py",
                "verification_command": "python Astro/scripts/subset-home-fonts.py --check",
                "python": platform.python_version(), "fontTools": fontTools.__version__,
                "sources": sources, "assets": assets, "total_bytes": sum(asset["bytes"] for asset in assets),
                "target_bytes": TARGET_BYTES, "coverage": "glyphs.json",
                "inputHashNormalization": INPUT_HASH_NORMALIZATION,
                "input_hashes_must_be_rechecked_after_content_freeze": True}
    (OUTPUT / "glyphs.json").write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    (OUTPUT / "provenance.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"generated": assets, "glyphs": len(required), "total_bytes": manifest["total_bytes"]}, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
