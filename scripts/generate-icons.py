#!/usr/bin/env python3
"""
Generate all required icons for iOS App Store and Google Play Store
from the base 512x512 icon.
"""
from PIL import Image, ImageDraw
import os
import shutil

BASE_ICON = "/home/ubuntu/buddymarket-webapp/client/public/icon-512x512.png"
PUBLIC_DIR = "/home/ubuntu/buddymarket-webapp/client/public"
ASSETS_DIR = "/home/ubuntu/webdev-static-assets/buddymarket-store-assets"
os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(f"{ASSETS_DIR}/ios", exist_ok=True)
os.makedirs(f"{ASSETS_DIR}/android", exist_ok=True)
os.makedirs(f"{ASSETS_DIR}/splash", exist_ok=True)

base = Image.open(BASE_ICON).convert("RGBA")

# ── iOS App Store icon sizes ──────────────────────────────────────────────────
# https://developer.apple.com/design/human-interface-guidelines/app-icons
IOS_SIZES = [
    # iPhone
    (20, "iphone-notification-20pt"),
    (40, "iphone-notification-20pt@2x"),
    (60, "iphone-notification-20pt@3x"),
    (29, "iphone-settings-29pt"),
    (58, "iphone-settings-29pt@2x"),
    (87, "iphone-settings-29pt@3x"),
    (40, "iphone-spotlight-40pt"),
    (80, "iphone-spotlight-40pt@2x"),
    (120, "iphone-spotlight-40pt@3x"),
    (120, "iphone-app-60pt@2x"),
    (180, "iphone-app-60pt@3x"),
    # iPad
    (20, "ipad-notification-20pt"),
    (40, "ipad-notification-20pt@2x"),
    (29, "ipad-settings-29pt"),
    (58, "ipad-settings-29pt@2x"),
    (40, "ipad-spotlight-40pt"),
    (80, "ipad-spotlight-40pt@2x"),
    (76, "ipad-app-76pt"),
    (152, "ipad-app-76pt@2x"),
    (167, "ipad-pro-app-83.5pt@2x"),
    # App Store
    (1024, "ios-app-store-1024"),
]

print("Generating iOS icons...")
for size, name in IOS_SIZES:
    img = base.resize((size, size), Image.LANCZOS)
    # App Store icon must be flat (no alpha)
    if size == 1024:
        bg = Image.new("RGB", (size, size), (249, 115, 22))
        if img.mode == "RGBA":
            bg.paste(img, mask=img.split()[3])
        else:
            bg.paste(img)
        bg.save(f"{ASSETS_DIR}/ios/{name}.png", "PNG", optimize=True)
    else:
        img.save(f"{ASSETS_DIR}/ios/{name}.png", "PNG", optimize=True)
    print(f"  ✓ {name}.png ({size}x{size})")

# ── Android icon sizes ────────────────────────────────────────────────────────
# https://developer.android.com/distribute/google-play/resources/icon-design-specifications
ANDROID_SIZES = [
    (48,  "mipmap-mdpi/ic_launcher"),
    (72,  "mipmap-hdpi/ic_launcher"),
    (96,  "mipmap-xhdpi/ic_launcher"),
    (144, "mipmap-xxhdpi/ic_launcher"),
    (192, "mipmap-xxxhdpi/ic_launcher"),
    (512, "play-store-icon"),  # Google Play Store
]

print("\nGenerating Android icons...")
for size, name in ANDROID_SIZES:
    folder = f"{ASSETS_DIR}/android/{os.path.dirname(name)}"
    os.makedirs(folder, exist_ok=True) if os.path.dirname(name) else None
    img = base.resize((size, size), Image.LANCZOS)
    out_path = f"{ASSETS_DIR}/android/{name}.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"  ✓ {name}.png ({size}x{size})")

# ── Android adaptive icon (foreground + background) ───────────────────────────
print("\nGenerating Android adaptive icons...")
for size, folder_name in [(48, "mipmap-mdpi"), (72, "mipmap-hdpi"), (96, "mipmap-xhdpi"), (144, "mipmap-xxhdpi"), (192, "mipmap-xxxhdpi")]:
    folder = f"{ASSETS_DIR}/android/{folder_name}"
    os.makedirs(folder, exist_ok=True)
    # Foreground: icon with padding (108dp safe zone)
    canvas_size = int(size * 108 / 72)
    fg = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    icon_size = int(canvas_size * 0.7)
    icon_resized = base.resize((icon_size, icon_size), Image.LANCZOS)
    offset = (canvas_size - icon_size) // 2
    fg.paste(icon_resized, (offset, offset), icon_resized)
    fg.save(f"{folder}/ic_launcher_foreground.png", "PNG")
    # Background: solid orange
    bg = Image.new("RGB", (canvas_size, canvas_size), (249, 115, 22))
    bg.save(f"{folder}/ic_launcher_background.png", "PNG")
    # Round icon
    round_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    icon_resized2 = base.resize((size, size), Image.LANCZOS)
    round_img.paste(icon_resized2, mask=mask)
    round_img.save(f"{folder}/ic_launcher_round.png", "PNG")
    print(f"  ✓ {folder_name}/ic_launcher_foreground|background|round.png")

# ── Splash screens ────────────────────────────────────────────────────────────
print("\nGenerating splash screens...")
BG_COLOR = (255, 248, 240)  # #FFF8F0
ICON_COLOR = (249, 115, 22)  # #F97316

SPLASH_SIZES = [
    # iOS
    (1170, 2532, "ios-iphone14-splash"),
    (1290, 2796, "ios-iphone14pro-max-splash"),
    (1179, 2556, "ios-iphone15-splash"),
    (1284, 2778, "ios-iphone13-pro-max-splash"),
    (828,  1792, "ios-iphone-xr-splash"),
    (750,  1334, "ios-iphone8-splash"),
    (2048, 2732, "ios-ipad-pro-12-splash"),
    (1668, 2388, "ios-ipad-pro-11-splash"),
    # Android
    (1080, 1920, "android-xxhdpi-splash"),
    (720,  1280, "android-xhdpi-splash"),
    (480,  800,  "android-hdpi-splash"),
]

for w, h, name in SPLASH_SIZES:
    splash = Image.new("RGB", (w, h), BG_COLOR)
    # Center icon at ~20% of the smaller dimension
    icon_size = min(w, h) // 4
    icon_resized = base.resize((icon_size, icon_size), Image.LANCZOS)
    x = (w - icon_size) // 2
    y = (h - icon_size) // 2 - int(h * 0.05)
    if icon_resized.mode == "RGBA":
        splash.paste(icon_resized, (x, y), icon_resized)
    else:
        splash.paste(icon_resized, (x, y))
    folder = f"{ASSETS_DIR}/splash"
    splash.save(f"{folder}/{name}.png", "PNG", optimize=True)
    print(f"  ✓ {name}.png ({w}x{h})")

# ── Copy key icons to public dir ──────────────────────────────────────────────
print("\nUpdating public/ icons...")
# iOS apple-touch-icon (180x180 for iPhone @3x)
img_180 = base.resize((180, 180), Image.LANCZOS)
img_180.save(f"{PUBLIC_DIR}/apple-touch-icon.png", "PNG", optimize=True)
# Standard sizes
for size in [72, 96, 128, 144, 152, 192, 384, 512]:
    img = base.resize((size, size), Image.LANCZOS)
    img.save(f"{PUBLIC_DIR}/icon-{size}x{size}.png", "PNG", optimize=True)
# Maskable icon (512x512 with padding for safe zone)
maskable = Image.new("RGBA", (512, 512), (249, 115, 22, 255))
icon_safe = base.resize((384, 384), Image.LANCZOS)  # 75% safe zone
offset = (512 - 384) // 2
maskable.paste(icon_safe, (offset, offset), icon_safe)
maskable.save(f"{PUBLIC_DIR}/icon-maskable-512x512.png", "PNG", optimize=True)
print("  ✓ icon-maskable-512x512.png (512x512 with safe zone)")

print(f"\n✅ All icons generated!")
print(f"   iOS icons:     {ASSETS_DIR}/ios/")
print(f"   Android icons: {ASSETS_DIR}/android/")
print(f"   Splash screens:{ASSETS_DIR}/splash/")
print(f"   Public icons:  {PUBLIC_DIR}/")
