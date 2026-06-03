"""Generate the expense-report architecture diagram as a standalone SVG.

Usage:
    python tools/gen_expense_arch.py <output.svg>

The SVG is hand-composed (no external libraries) so it renders identically
in every browser and inside Chirpy/Jekyll.
"""
from __future__ import annotations

import sys
from pathlib import Path
from textwrap import dedent

# ---------- design tokens ----------
W, H = 1240, 960
BG = "#ffffff"

# Color palette mirrors the LLM-boundary semantics used in the post.
PALETTE = {
    "user":   {"fill": "#e3f2fd", "stroke": "#1565c0", "text": "#0d47a1"},
    "agent":  {"fill": "#bbdefb", "stroke": "#1565c0", "text": "#0d47a1"},
    "flow":   {"fill": "#c8e6c9", "stroke": "#2e7d32", "text": "#1b5e20"},
    "reason": {"fill": "#ffe0b2", "stroke": "#ef6c00", "text": "#e65100"},
    "human":  {"fill": "#ffcdd2", "stroke": "#c62828", "text": "#b71c1c"},
    "branch": {"fill": "#fff9c4", "stroke": "#f9a825", "text": "#f57f17"},
    "group_agent": {"fill": "#f5fbff", "stroke": "#1565c0"},
    "group_flow":  {"fill": "#f3faf3", "stroke": "#2e7d32"},
}

FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"


# ---------- primitives ----------
def rect(x, y, w, h, kind, label, sublabel=None, rx=10, font_size=15):
    p = PALETTE[kind]
    parts = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" ry="{rx}" '
        f'fill="{p["fill"]}" stroke="{p["stroke"]}" stroke-width="2"/>'
    ]
    if sublabel:
        parts.append(text(x + w / 2, y + h / 2 - 9, label, p["text"], font_size, bold=True))
        parts.append(text(x + w / 2, y + h / 2 + 12, sublabel, p["text"], font_size - 2))
    else:
        parts.append(text(x + w / 2, y + h / 2 + 5, label, p["text"], font_size, bold=True))
    return "\n".join(parts)


def diamond(cx, cy, w, h, kind, label, font_size=14):
    p = PALETTE[kind]
    pts = f"{cx},{cy - h/2} {cx + w/2},{cy} {cx},{cy + h/2} {cx - w/2},{cy}"
    return (
        f'<polygon points="{pts}" fill="{p["fill"]}" stroke="{p["stroke"]}" stroke-width="2"/>\n'
        + text(cx, cy + 5, label, p["text"], font_size, bold=True)
    )


def pill(cx, cy, w, h, kind, label, font_size=15):
    return rect(cx - w / 2, cy - h / 2, w, h, kind, label, rx=h / 2, font_size=font_size)


def group(x, y, w, h, kind, title):
    p = PALETTE[kind]
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" ry="14" '
        f'fill="{p["fill"]}" stroke="{p["stroke"]}" stroke-width="2" '
        f'stroke-dasharray="6 4"/>\n'
        f'<text x="{x + 16}" y="{y + 24}" font-family="{FONT}" font-size="14" '
        f'font-weight="700" fill="{p["stroke"]}">{title}</text>'
    )


def text(x, y, content, color, size=15, bold=False, anchor="middle"):
    weight = "700" if bold else "400"
    return (
        f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
        f'font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{content}</text>'
    )


def arrow(x1, y1, x2, y2, label=None, color="#37474f", label_offset=(0, -10),
          label_pos=0.5):
    """Straight arrow from (x1,y1) to (x2,y2) with optional pill-backed label."""
    parts = [
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" '
        f'stroke-width="2" marker-end="url(#arrow)"/>'
    ]
    if label:
        lx = x1 + (x2 - x1) * label_pos + label_offset[0]
        ly = y1 + (y2 - y1) * label_pos + label_offset[1]
        approx_w = max(60, len(label) * 6.4)
        parts.append(
            f'<rect x="{lx - approx_w/2}" y="{ly - 12}" width="{approx_w}" height="20" '
            f'rx="10" ry="10" fill="#ffffff" stroke="{color}" stroke-width="1" opacity="0.96"/>'
        )
        parts.append(text(lx, ly + 3, label, color, 12, bold=True))
    return "\n".join(parts)


def ortho_arrow(points, label=None, color="#37474f", label_at=None, label_offset=(0, -10)):
    """Right-angle arrow that follows a list of (x,y) waypoints.

    label_at is an index into points (the segment ending at that index gets the label).
    """
    path_parts = [f"M {points[0][0]} {points[0][1]}"]
    for x, y in points[1:]:
        path_parts.append(f"L {x} {y}")
    path = " ".join(path_parts)
    parts = [
        f'<path d="{path}" fill="none" stroke="{color}" stroke-width="2" '
        f'marker-end="url(#arrow)"/>'
    ]
    if label:
        idx = label_at if label_at is not None else len(points) // 2
        idx = max(1, min(idx, len(points) - 1))
        x1, y1 = points[idx - 1]
        x2, y2 = points[idx]
        lx = (x1 + x2) / 2 + label_offset[0]
        ly = (y1 + y2) / 2 + label_offset[1]
        approx_w = max(60, len(label) * 6.4)
        parts.append(
            f'<rect x="{lx - approx_w/2}" y="{ly - 12}" width="{approx_w}" height="20" '
            f'rx="10" ry="10" fill="#ffffff" stroke="{color}" stroke-width="1" opacity="0.96"/>'
        )
        parts.append(text(lx, ly + 3, label, color, 12, bold=True))
    return "\n".join(parts)


def legend_swatch(x, y, kind, label):
    p = PALETTE[kind]
    return (
        f'<rect x="{x}" y="{y}" width="20" height="20" rx="5" ry="5" '
        f'fill="{p["fill"]}" stroke="{p["stroke"]}" stroke-width="2"/>\n'
        + text(x + 28, y + 15, label, "#263238", 13, anchor="start")
    )


# ---------- compose the diagram ----------
def build():
    body = []

    # arrowhead marker
    defs = dedent(
        """
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#37474f"/>
          </marker>
          <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3"/>
          </filter>
        </defs>
        """
    ).strip()
    body.append(defs)

    # title
    body.append(text(W / 2, 38, "Expense Report Architecture", "#0d47a1", 22, bold=True))
    body.append(text(W / 2, 60, "Pattern 2 (Conversation-First Automation) wrapping Pattern 1 (Reasoning-in-the-Loop)",
                     "#546e7a", 13))

    # Agent group (left column) - placed first so we can anchor the user pill above it
    agent_x, agent_y, agent_w, agent_h = 60, 200, 480, 300
    agent_mid_x = agent_x + agent_w / 2

    # User pill (above the agent column, since the user enters via the agent)
    user_cx, user_cy = agent_mid_x, 100
    body.append(pill(user_cx, user_cy, 260, 42, "user", "👤  User — Teams or WebChat", font_size=14))

    body.append(group(agent_x, agent_y, agent_w, agent_h, "group_agent",
                      "🗣️  COPILOT STUDIO AGENT — Expense Assistant"))
    a_steps = [
        "Understands natural-language requests",
        "Gathers missing info conversationally",
        "Calls agent flow to process the report",
        "Summarizes results back to the user",
    ]
    for i, step in enumerate(a_steps):
        y = agent_y + 56 + i * 56
        body.append(rect(agent_x + 24, y, agent_w - 48, 44, "agent", step, font_size=14))

    # Flow group (right column)
    flow_x, flow_y, flow_w, flow_h = 700, 200, 480, 640
    body.append(group(flow_x, flow_y, flow_w, flow_h, "group_flow",
                      "⚙️  AGENT FLOW — Process Expense Report"))

    # Flow steps
    step_w = flow_w - 48
    base_x = flow_x + 24
    f1_y = flow_y + 56
    body.append(rect(base_x, f1_y, step_w, 44, "flow",
                     "1 · Validate inputs and normalize currency", font_size=14))
    f2_y = f1_y + 64
    body.append(rect(base_x, f2_y, step_w, 44, "flow",
                     "2 · Load line items from Dataverse", font_size=14))
    f3_y = f2_y + 84  # extra room above to host the Pattern 1 banner
    # Pattern 1 banner sits in the gap immediately above the amber agent node
    pat1_color = PALETTE["reason"]["stroke"]
    body.append(
        f'<text x="{base_x + step_w / 2}" y="{f3_y - 8}" '
        f'text-anchor="middle" font-family="{FONT}" font-size="12" '
        f'font-style="italic" font-weight="600" fill="{pat1_color}">'
        f'↓ Pattern 1: Reasoning-in-the-Loop ↓</text>'
    )
    body.append(rect(base_x, f3_y, step_w, 70, "reason",
                     "3 · 🧠 Agent node: Policy Checker",
                     "grounded in policy SharePoint • returns compliant / reason / risk_level / confidence",
                     font_size=14))

    # Branch diamond
    branch_cx = flow_x + flow_w / 2
    branch_cy = f3_y + 70 + 70
    body.append(diamond(branch_cx, branch_cy, 220, 84, "branch", "4 · Branch on result"))

    # Two-way split — equal-sized boxes flush with the flow column edges,
    # both with sublabels so the title rows align horizontally.
    split_y = branch_cy + 84
    split_w, split_h = 200, 60
    auto_x = base_x
    appr_x = base_x + step_w - split_w
    body.append(rect(auto_x, split_y, split_w, split_h, "flow",
                     "5a · Auto-approve",
                     "policy-compliant path", font_size=14))
    body.append(rect(appr_x, split_y, split_w, split_h, "human",
                     "5b · 👥 Route to Approvals",
                     "human in the loop", font_size=14))

    # Merge step
    f6_y = split_y + 96
    body.append(rect(base_x, f6_y, step_w, 44, "flow",
                     "6 · Post journal entry to AP system", font_size=14))
    f7_y = f6_y + 64
    body.append(rect(base_x, f7_y, step_w, 44, "flow",
                     "7 · Return result to agent", font_size=14))

    # ---------- arrows ----------
    # User <-> Agent group: two parallel vertical arrows in the gap between
    # the user pill and the top of the agent group.
    user_bottom = user_cy + 21
    agent_top = agent_y
    body.append(arrow(agent_mid_x - 50, user_bottom, agent_mid_x - 50, agent_top,
                      "natural language", label_offset=(-80, 4)))
    body.append(arrow(agent_mid_x + 50, agent_top, agent_mid_x + 50, user_bottom,
                      "explanation", label_offset=(60, 4)))

    # Agent group -> Flow group: orthogonal arrow, exits right side of agent
    # group near "Calls agent flow", enters left side of flow group above the
    # agent-node row so it doesn't cut through any step.
    agent_right_x = agent_x + agent_w
    flow_left_x = flow_x
    gap_mid_x = (agent_right_x + flow_left_x) / 2
    a3_y = agent_y + 56 + 2 * 56 + 22  # mid-y of "Calls agent flow"
    flow_entry_y = f3_y - 12  # just above the amber agent node
    body.append(ortho_arrow(
        [(agent_right_x, a3_y), (gap_mid_x, a3_y), (gap_mid_x, flow_entry_y),
         (flow_left_x, flow_entry_y)],
        label="Pattern 2: Conversation-First Automation",
        label_at=2,
        label_offset=(0, -16),
    ))

    # Flow group -> Agent group: return path from "7 · Return result" back to
    # row 4 ("Summarizes results") of the agent group.
    a4_y = agent_y + 56 + 3 * 56 + 22
    f7_mid_y = f7_y + 22
    body.append(ortho_arrow(
        [(flow_left_x, f7_mid_y), (gap_mid_x, f7_mid_y), (gap_mid_x, a4_y),
         (agent_right_x, a4_y)],
        label="structured result",
        label_at=2,
        label_offset=(0, -16),
    ))

    # Flow internal vertical sequence (centered)
    body.append(arrow(branch_cx, f1_y + 44, branch_cx, f2_y))
    body.append(arrow(branch_cx, f2_y + 44, branch_cx, f3_y))
    body.append(arrow(branch_cx, f3_y + 70, branch_cx, branch_cy - 42))

    # Branch -> 5a (orthogonal: left vertex of diamond, then down to top of 5a)
    auto_top_cx = auto_x + split_w / 2
    appr_top_cx = appr_x + split_w / 2
    body.append(ortho_arrow(
        [(branch_cx - 110, branch_cy), (auto_top_cx, branch_cy),
         (auto_top_cx, split_y)],
        label="compliant", label_at=1, label_offset=(0, -10),
    ))
    # Branch -> 5b (orthogonal: right vertex of diamond, then down to top of 5b)
    body.append(ortho_arrow(
        [(branch_cx + 110, branch_cy), (appr_top_cx, branch_cy),
         (appr_top_cx, split_y)],
        label="exceptions", label_at=1, label_offset=(0, -10),
    ))

    # 5a / 5b -> 6 (orthogonal merge into top of step 6 from a shared rail)
    rail_y = f6_y - 22
    body.append(ortho_arrow(
        [(auto_top_cx, split_y + split_h), (auto_top_cx, rail_y),
         (branch_cx, rail_y), (branch_cx, f6_y)],
    ))
    body.append(ortho_arrow(
        [(appr_top_cx, split_y + split_h), (appr_top_cx, rail_y),
         (branch_cx, rail_y), (branch_cx, f6_y)],
    ))
    # 6 -> 7
    body.append(arrow(branch_cx, f6_y + 44, branch_cx, f7_y))

    # ---------- legend ----------
    legend_y = H - 90
    body.append(text(60, legend_y - 10, "Color = LLM boundary", "#263238", 13, bold=True, anchor="start"))
    swatches = [
        ("agent",  "Conversation"),
        ("flow",   "Deterministic execution"),
        ("reason", "Embedded reasoning"),
        ("branch", "Deterministic branch"),
        ("human",  "Human governance"),
    ]
    x = 60
    for kind, label in swatches:
        body.append(legend_swatch(x, legend_y, kind, label))
        x += 28 + len(label) * 7.5 + 24

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}" '
        f'preserveAspectRatio="xMidYMid meet" '
        f'style="max-width:100%; height:auto; background:{BG};">\n'
        + "\n".join(body)
        + "\n</svg>\n"
    )
    return svg


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("expense_arch.svg")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build(), encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
