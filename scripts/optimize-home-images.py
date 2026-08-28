"""Generate responsive WebP variants without modifying the source artwork.

Requires Pillow. These widths cover the real rendered sizes at approximately
2x device density; the original files remain available as the large srcset
candidate.
"""

from pathlib import Path
from PIL import Image


ASSET_ROOT = Path(__file__).resolve().parents[1] / "public" / "assets"

VARIANTS = {
    "licenceflow-logo.webp": ("licenceflow-logo-160.webp", 160),
    "parivahan-transport-hero.webp": ("parivahan-transport-hero-960.webp", 960),
    "service-driving-licence.webp": ("service-driving-licence-360.webp", 360),
    "service-vehicle-reg.webp": ("service-vehicle-reg-360.webp", 360),
    "service-commercial.webp": ("service-commercial-360.webp", 360),
    "service-road-safety.webp": ("service-road-safety-360.webp", 360),
    "ecosystem-mparivahan.webp": ("ecosystem-mparivahan-560.webp", 560),
    "ecosystem-echallan.webp": ("ecosystem-echallan-560.webp", 560),
    "ecosystem-pucc.webp": ("ecosystem-pucc-560.webp", 560),
    "ecosystem-green-sewa.webp": ("ecosystem-green-sewa-560.webp", 560),
}

RAAHI_VARIANTS = {
    "raahi-welcome.webp": ("raahi-welcome-240.webp", 240),
    "raahi-pointing.webp": ("raahi-pointing-240.webp", 240),
    "raahi-thinking.webp": ("raahi-thinking-240.webp", 240),
    "raahi-working.webp": ("raahi-working-240.webp", 240),
    "raahi-celebrate.webp": ("raahi-celebrate-240.webp", 240),
    "raahi-confident.webp": ("raahi-confident-240.webp", 240),
}

EXTRA_VARIANTS = [
    (ASSET_ROOT / "parivahan-transport-hero.webp", ASSET_ROOT / "parivahan-transport-hero-1200.webp", 1200),
    (ASSET_ROOT / "raahi" / "raahi-welcome.webp", ASSET_ROOT / "raahi" / "raahi-welcome-320.webp", 320),
]


def resize(source: Path, destination: Path, width: int) -> None:
    with Image.open(source) as image:
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        resized.save(destination, "WEBP", quality=78, method=6)
        print(f"{destination.relative_to(ASSET_ROOT)}: {width}x{height} · {destination.stat().st_size} bytes")


for source_name, (destination_name, width) in VARIANTS.items():
    resize(ASSET_ROOT / source_name, ASSET_ROOT / destination_name, width)

raahi_root = ASSET_ROOT / "raahi"
for source_name, (destination_name, width) in RAAHI_VARIANTS.items():
    resize(raahi_root / source_name, raahi_root / destination_name, width)

for source, destination, width in EXTRA_VARIANTS:
    resize(source, destination, width)
