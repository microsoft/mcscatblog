"""
Generates a high-quality 1600x900 header image for the
Agent Flows and Agents: Enterprise Integration Patterns blog post.
"""
import math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else "header.png"
W, H = 1600, 900

# ── Colour palette ──────────────────────────────────────────────────────────
BG_DARK    = (5, 15, 35)
BG_MID     = (10, 38, 80)
CYAN       = (0, 210, 255)
AMBER      = (255, 155, 30)
WHITE      = (255, 255, 255)
SOFT_WHITE = (225, 235, 255)
DIM_WHITE  = (170, 190, 230)
DARK_CARD  = (10, 30, 65, 210)   # RGBA
CYAN_CARD  = (0, 175, 220, 55)
AMBER_CARD = (220, 120, 20, 55)
CYAN_GLOW  = (0, 210, 255, 30)
AMBER_GLOW = (255, 155, 30, 30)

# ── Font loader ──────────────────────────────────────────────────────────────
def font(path, size, fallback_size=None):
    candidates = [
        path,
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            pass
    return ImageFont.load_default()

font_title    = font(r"C:\Windows\Fonts\segoeuib.ttf", 88)
font_subtitle = font(r"C:\Windows\Fonts\segoeui.ttf",  44)
font_tag      = font(r"C:\Windows\Fonts\segoeuib.ttf", 30)
font_lane     = font(r"C:\Windows\Fonts\segoeuib.ttf", 28)
font_small    = font(r"C:\Windows\Fonts\segoeui.ttf",  26)

# ── Canvas ───────────────────────────────────────────────────────────────────
img = Image.new("RGBA", (W, H), BG_DARK)
draw = ImageDraw.Draw(img)

# ── Background gradient (top-left dark → bottom-right blue) ─────────────────
for y in range(H):
    t = y / H
    r = int(BG_DARK[0] + (BG_MID[0] - BG_DARK[0]) * t)
    g = int(BG_DARK[1] + (BG_MID[1] - BG_DARK[1]) * t)
    b = int(BG_DARK[2] + (BG_MID[2] - BG_DARK[2]) * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# ── Dot grid overlay ─────────────────────────────────────────────────────────
STEP = 40
for gx in range(0, W, STEP):
    for gy in range(0, H, STEP):
        # Brightness falls off toward the centre of the text area
        dist_to_right = gx / W           # 0 at left, 1 at right
        alpha = int(28 + dist_to_right * 38)
        draw.ellipse([(gx-1, gy-1), (gx+1, gy+1)], fill=(120, 165, 220, alpha))

# ── Right-half split card ─────────────────────────────────────────────────────
#  Draw as RGBA layer so we get real transparency
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)

# Large containing card (right half)
odraw.rounded_rectangle([(790, 60), (W - 30, H - 60)], radius=28, fill=DARK_CARD)

# Top lane: FLOW (cyan accent)
odraw.rounded_rectangle([(820, 100), (W - 60, 440)], radius=20, fill=CYAN_CARD)
odraw.rounded_rectangle([(820, 100), (W - 60, 440)], radius=20,
                        outline=CYAN + (180,), width=2)

# Bottom lane: AGENT (amber accent)
odraw.rounded_rectangle([(820, 490), (W - 60, H - 100)], radius=20, fill=AMBER_CARD)
odraw.rounded_rectangle([(820, 490), (W - 60, H - 100)], radius=20,
                        outline=AMBER + (180,), width=2)

img = Image.alpha_composite(img.convert("RGBA"), overlay)
draw = ImageDraw.Draw(img)

# ── Diagram: nodes and connectors ────────────────────────────────────────────
#  Top row (flow nodes) — 4 nodes across the cyan lane
flow_y   = 270
agent_y  = 620
xs       = [900, 1090, 1280, 1470]

# Horizontal connectors (flow layer)
for i in range(len(xs) - 1):
    draw.line([(xs[i]+20, flow_y), (xs[i+1]-20, flow_y)],
              fill=CYAN + (200,), width=4)

# Horizontal connectors (agent layer)
for i in range(len(xs) - 1):
    draw.line([(xs[i]+20, agent_y), (xs[i+1]-20, agent_y)],
              fill=AMBER + (200,), width=4)

# Vertical bridges between layers (middle two nodes)
for xi in [xs[1], xs[2]]:
    draw.line([(xi, flow_y+20), (xi, agent_y-20)],
              fill=(200, 220, 255, 180), width=3)

# Small bridge arrow heads (simple triangles)
def arrowhead(x, y, pointing, color):
    if pointing == "down":
        pts = [(x, y+10), (x-7, y-6), (x+7, y-6)]
    else:
        pts = [(x, y-10), (x-7, y+6), (x+7, y+6)]
    draw.polygon(pts, fill=color + (200,))

for xi in [xs[1], xs[2]]:
    arrowhead(xi, agent_y - 20, "down", (200, 220, 255))

# Nodes — flow layer (cyan)
for x in xs:
    # Glow
    draw.ellipse([(x-28, flow_y-28), (x+28, flow_y+28)], fill=CYAN + (40,))
    draw.ellipse([(x-18, flow_y-18), (x+18, flow_y+18)], fill=CYAN + (90,))
    draw.ellipse([(x-10, flow_y-10), (x+10, flow_y+10)], fill=CYAN)

# Nodes — agent layer (amber)
for x in xs:
    draw.ellipse([(x-28, agent_y-28), (x+28, agent_y+28)], fill=AMBER + (40,))
    draw.ellipse([(x-18, agent_y-18), (x+18, agent_y+18)], fill=AMBER + (90,))
    draw.ellipse([(x-10, agent_y-10), (x+10, agent_y+10)], fill=AMBER)

# ── Accent diagonal stripe (behind right card, left edge) ────────────────────
stripe = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(stripe)
sdraw.polygon([(760, 0), (810, 0), (810, H), (760, H)], fill=CYAN + (25,))
img = Image.alpha_composite(img, stripe)
draw = ImageDraw.Draw(img)

# ── Lane labels ───────────────────────────────────────────────────────────────
draw.text((848, 116), "FLOW ORCHESTRATION LAYER", font=font_lane, fill=CYAN)
draw.text((848, 500), "AGENT REASONING LAYER",    font=font_lane, fill=AMBER)

# ── Left-hand typography ──────────────────────────────────────────────────────
# Drop shadow for title
shadow_offset = 3
draw.text((82 + shadow_offset, 118 + shadow_offset),
          "Agent Flows", font=font_title, fill=(0, 0, 0, 180))
draw.text((82, 118), "Agent Flows", font=font_title, fill=WHITE)

draw.text((82 + shadow_offset, 212 + shadow_offset),
          "and Agents", font=font_title, fill=(0, 0, 0, 180))
draw.text((82, 212), "and Agents", font=font_title, fill=CYAN)

# Divider line
draw.rectangle([(82, 322), (450, 326)], fill=CYAN + (160,))

draw.text((82, 344), "Enterprise Integration Patterns",
          font=font_subtitle, fill=SOFT_WHITE)
draw.text((82, 402), "Designing deterministic & adaptive systems",
          font=font_small, fill=DIM_WHITE)

# ── Bottom badge ──────────────────────────────────────────────────────────────
badge_l, badge_t = 82, H - 130
badge_w, badge_h = 360, 72
draw.rounded_rectangle(
    [(badge_l, badge_t), (badge_l + badge_w, badge_t + badge_h)],
    radius=18,
    fill=(0, 0, 0, 180),
    outline=CYAN + (200,),
    width=2
)
draw.text((badge_l + 20, badge_t + 16), "Copilot Studio",
          font=font_tag, fill=CYAN)

# ── Subtle vignette ───────────────────────────────────────────────────────────
vgn = Image.new("RGBA", (W, H), (0, 0, 0, 0))
vg  = ImageDraw.Draw(vgn)
for i in range(80, 0, -1):
    alpha = int((1 - i / 80) ** 2 * 140)
    vg.rounded_rectangle([(i, i), (W - i, H - i)], radius=0, outline=(0, 0, 0, alpha), width=2)
img = Image.alpha_composite(img, vgn)

# ── Save ──────────────────────────────────────────────────────────────────────
out_rgb = img.convert("RGB")
out_rgb.save(OUT, "PNG", optimize=True)
print(f"Saved {OUT} ({W}x{H}) — {out_rgb.size}")
