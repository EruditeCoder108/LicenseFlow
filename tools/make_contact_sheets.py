from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

source = Path("images")
output = Path(".research/contact-sheets")
output.mkdir(parents=True, exist_ok=True)

files = sorted(source.glob("*.png"), key=lambda path: path.name)
font = ImageFont.load_default(size=18)
columns, rows = 2, 4
thumb_width, thumb_height = 600, 338
label_height = 34
sheet_size = (columns * thumb_width, rows * (thumb_height + label_height))

for sheet_index in range(0, len(files), columns * rows):
    batch = files[sheet_index : sheet_index + columns * rows]
    sheet = Image.new("RGB", sheet_size, "white")
    draw = ImageDraw.Draw(sheet)
    for item_index, path in enumerate(batch):
        image = Image.open(path).convert("RGB")
        image.thumbnail((thumb_width, thumb_height))
        x = (item_index % columns) * thumb_width
        y = (item_index // columns) * (thumb_height + label_height)
        image_x = x + (thumb_width - image.width) // 2
        image_y = y + (thumb_height - image.height) // 2
        sheet.paste(image, (image_x, image_y))
        draw.rectangle((x, y + thumb_height, x + thumb_width, y + thumb_height + label_height), fill="#101817")
        draw.text((x + 10, y + thumb_height + 7), f"{sheet_index + item_index + 1:02d} · {path.stem}", fill="white", font=font)
    sheet.save(output / f"contact-{sheet_index // (columns * rows) + 1:02d}.jpg", quality=88)
