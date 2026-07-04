#!/usr/bin/env python3
"""Generate static/og-image.png for social link previews."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Install Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static" / "og-image.png"
W, H = 1200, 630


def main():
    img = Image.new("RGB", (W, H), "#4C00FF")
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(76 + (45 - 76) * t)
        g = int(0 + (0 - 0) * t)
        b = int(255 + (128 - 255) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 52)
        sub_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24)
        brand_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 42)
        small_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except OSError:
        title_font = sub_font = brand_font = small_font = ImageFont.load_default()

    draw.rounded_rectangle((80, 80, 136, 136), radius=12, fill="white")
    draw.text((108, 108), "DS", fill="#4C00FF", font=small_font, anchor="mm")
    draw.text((160, 95), "Docusign IAM", fill="white", font=brand_font)
    draw.text((160, 140), "Government Demo Portal", fill=(255, 255, 255, 180), font=sub_font)
    draw.text((80, 260), "Intelligent contract", fill="white", font=title_font)
    draw.text((80, 330), "management for government", fill="white", font=title_font)
    draw.text((80, 410), "Live eSignature · CLM · Web Forms · Connect · ERP sync", fill=(220, 220, 240), font=sub_font)
    draw.rounded_rectangle((80, 460, 400, 512), radius=26, fill="white")
    draw.text((240, 486), "docusign-iam-demo.vercel.app", fill="#1a1a1a", font=small_font, anchor="mm")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
