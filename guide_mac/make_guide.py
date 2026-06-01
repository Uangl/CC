# -*- coding: utf-8 -*-
"""生成 Mac 从零部署「混凝土配合比联网版」的图文步骤示意图。"""
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1100, 720
BG = "#eef1f5"
CJK = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONOB = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
SANSB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def cf(sz): return ImageFont.truetype(CJK, sz)
def mf(sz, b=False): return ImageFont.truetype(MONOB if b else MONO, sz)

F_TITLE = cf(30); F_H = cf(24); F_BODY = cf(20); F_SM = cf(17); F_TINY = cf(15)
F_M = mf(19); F_MB = mf(19, True); F_MS = mf(16); F_BADGE = ImageFont.truetype(SANSB, 34)

RED = "#e23b3b"; BLUE = "#2d6cdf"; GREEN = "#1f9d55"; INK = "#1b2733"; GREY = "#6b7785"

def arrow(d, p1, p2, color=RED, width=5, head=16):
    d.line([p1, p2], fill=color, width=width)
    ang = math.atan2(p2[1]-p1[1], p2[0]-p1[0])
    for a in (ang+math.radians(152), ang-math.radians(152)):
        d.line([p2, (p2[0]+head*math.cos(a), p2[1]+head*math.sin(a))], fill=color, width=width)

def wrap(d, x, y, text, font, maxw, fill="#243240", lh=28):
    line = ""
    for ch in text:
        if ch == "\n":
            d.text((x, y), line, font=font, fill=fill); y += lh; line = ""; continue
        t = line+ch
        if d.textlength(t, font=font) > maxw and line:
            d.text((x, y), line, font=font, fill=fill); y += lh; line = ch
        else:
            line = t
    if line:
        d.text((x, y), line, font=font, fill=fill); y += lh
    return y

def window(d, box, title, body="#ffffff", bar="#e9edf2", tc="#555"):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0+6, y0+8, x1+6, y1+8], radius=14, fill="#d7dde5")  # shadow
    d.rounded_rectangle(box, radius=14, fill=body, outline="#c3cbd5", width=2)
    d.rounded_rectangle([x0, y0, x1, y0+40], radius=14, fill=bar)
    d.rectangle([x0, y0+28, x1, y0+40], fill=bar)
    d.line([x0, y0+40, x1, y0+40], fill="#c3cbd5", width=2)
    for i, c in enumerate(["#ff5f57", "#febc2e", "#28c840"]):
        cx = x0+24+i*22
        d.ellipse([cx-7, y0+13, cx+7, y0+27], fill=c)
    tw = d.textlength(title, font=F_SM)
    d.text(((x0+x1)/2 - tw/2, y0+11), title, font=F_SM, fill=tc)
    return (x0, y0+40, x1, y1)

def band(d, num, title, sub, prog):
    d.rectangle([0, 0, W, 104], fill="#ffffff")
    d.line([0, 104, W, 104], fill="#dfe4ea", width=2)
    tx = 40
    if num is not None:
        d.ellipse([36, 28, 86, 78], fill=BLUE)
        s = str(num); tw = d.textlength(s, font=F_BADGE)
        d.text((61-tw/2, 33), s, font=F_BADGE, fill="#fff")
        tx = 104
    d.text((tx, 28), title, font=F_TITLE, fill=INK)
    if sub:
        d.text((tx, 66), sub, font=F_SM, fill=GREY)
    if prog:
        pw = d.textlength(prog, font=F_SM)
        d.rounded_rectangle([W-56-pw, 40, W-24, 70], radius=14, fill="#eef3ff")
        d.text((W-40-pw, 44), prog, font=F_SM, fill=BLUE)

def tip(d, text):
    box = [36, 650, W-36, 704]
    d.rounded_rectangle(box, radius=10, fill="#fff7e0", outline="#f0d98a", width=2)
    d.text((54, 666), "小贴士：", font=F_BODY, fill="#9a6b00")
    off = d.textlength("小贴士：", font=F_BODY)
    wrap(d, 54+off, 666, text, F_BODY, W-36-(54+off)-14, fill="#7a5a00", lh=26)

def bullets(d, x, y, items, w=336):
    for it in items:
        d.ellipse([x, y+6, x+13, y+19], fill=RED)
        y = wrap(d, x+26, y, it, F_BODY, w-26, fill="#243240", lh=28) + 12
    return y

def newimg():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)

def is_cjk(ch):
    return ord(ch) >= 0x2E80

def draw_mixed(d, x, y, text, size, color, bold=False):
    """逐字混排：ASCII 用等宽字体，中文用文泉驿，避免中文豆腐块。"""
    fm = mf(size, bold); fc = cf(size)
    for ch in text:
        f = fc if is_cjk(ch) else fm
        d.text((x, y), ch, font=f, fill=color)
        x += d.textlength(ch, font=f)
    return x

def term_lines(d, inner, lines):
    """lines: list of (segments) where segments=[(text,color,bold)]"""
    x0, y0, x1, y1 = inner
    d.rounded_rectangle([x0, y0, x1, y1], radius=0, fill="#1e1f2b")
    y = y0+18
    for segs in lines:
        x = x0+22
        for (t, c, b) in segs:
            x = draw_mixed(d, x, y, t, 18, c, b)
        y += 30
    return

P_USER = "MacBook:cc me$ "

# ---------------- 0 总览 ----------------
def s0():
    img, d = newimg()
    band(d, None, "Mac 从零部署 · 总览", "把 AI Key 配好并跑起来，全程约 10 分钟", "总览")
    steps = [
        ("1", "安装 Node.js", "运行环境，装一次即可"),
        ("2", "下载项目并解压", "GitHub → Download ZIP"),
        ("3", "打开「终端」进文件夹", "把文件夹拖进终端"),
        ("4", "安装依赖 + 打开配置", "npm install"),
        ("5", "填入 API Key 并保存", "改 .env 里那一行"),
        ("6", "启动并在浏览器查看", "npm start → 绿色「在线」"),
    ]
    cw, ch, gx, gy = 320, 150, 35, 40
    x0, y0 = 50, 150
    centers = []
    for i, (n, t, h) in enumerate(steps):
        r, c = divmod(i, 3)
        x = x0 + c*(cw+gx); y = y0 + r*(ch+gy)
        d.rounded_rectangle([x, y, x+cw, y+ch], radius=14, fill="#ffffff", outline="#d3dae3", width=2)
        d.ellipse([x+20, y+22, x+62, y+64], fill=BLUE)
        tw = d.textlength(n, font=F_BADGE)
        d.text((x+41-tw/2, y+25), n, font=F_BADGE, fill="#fff")
        d.text((x+78, y+24), t, font=F_H, fill=INK)
        wrap(d, x+24, y+78, h, F_SM, cw-40, fill=GREY, lh=24)
        centers.append((x, y, x+cw, y+ch))
    # arrows 1->2->3 ; 3 down to 4(below) ; 4->5->6
    def myr(b): return (b[2], (b[1]+b[3])/2)
    def myl(b): return (b[0]-6, (b[1]+b[3])/2)
    for a, b in [(0, 1), (1, 2), (3, 4), (4, 5)]:
        arrow(d, myr(centers[a]), myl(centers[b]), BLUE)
    tip(d, "下面每一张图对应其中一步，照着做即可。只需复制粘贴几条命令，不用懂代码。")
    img.save("/home/user/CC/guide_mac/s0_总览.png")

# ---------------- 1 安装 Node ----------------
def s1():
    img, d = newimg()
    band(d, 1, "安装 Node.js（运行环境）", "在浏览器里下载并安装，装一次以后都不用再装", "第 1 步 / 共 6 步")
    inner = window(d, [36, 124, 700, 612], "Safari — nodejs.org")
    x0, y0, x1, y1 = inner
    # toolbar
    d.rectangle([x0, y0, x1, y0+46], fill="#f3f5f8")
    for i in range(3):
        d.ellipse([x0+18+i*20, y0+16, x0+30+i*20, y0+28], outline="#b9c2cc", width=2)
    d.rounded_rectangle([x0+86, y0+12, x1-20, y0+34], radius=11, fill="#ffffff", outline="#cdd5de", width=1)
    d.text((x0+100, y0+15), "nodejs.org", font=F_MS, fill="#333")
    # page
    py = y0+92
    d.text((x0+40, py), "Node.js", font=cf(40), fill="#3c873a")
    wrap(d, x0+40, py+64, "在你的电脑上运行 JavaScript 的环境", F_BODY, x1-x0-80, fill=GREY)
    btn = [x0+40, py+120, x0+360, py+176]
    d.rounded_rectangle(btn, radius=12, fill="#3c873a")
    bt = "下载 Node.js (LTS)"
    tw = d.textlength(bt, font=F_H)
    d.text(((btn[0]+btn[2])/2-tw/2, btn[1]+13), bt, font=F_H, fill="#fff")
    d.rounded_rectangle([btn[0]-6, btn[1]-6, btn[2]+6, btn[3]+6], radius=15, outline=RED, width=4)
    arrow(d, (btn[2]+90, btn[3]+70), (btn[2]+14, (btn[1]+btn[3])/2))
    d.text((btn[2]-30, btn[3]+78), "点这个绿色按钮", font=F_BODY, fill=RED)
    bullets(d, 728, 150, [
        "浏览器地址栏输入 nodejs.org 回车",
        "点绿色按钮，选「LTS 长期支持版」",
        "下载完双击得到的 .pkg 文件",
        "弹出安装向导，一路点「继续 / 安装」，输入开机密码即可",
    ])
    tip(d, "装好后看不到任何新图标，这是正常的——Node 在后台待命。")
    img.save("/home/user/CC/guide_mac/s1_安装Node.png")

# ---------------- 2 下载项目 ----------------
def s2():
    img, d = newimg()
    band(d, 2, "下载项目文件并解压", "从 GitHub 仓库下载整包代码到电脑", "第 2 步 / 共 6 步")
    inner = window(d, [36, 124, 700, 612], "Safari — github.com / uangl / cc")
    x0, y0, x1, y1 = inner
    d.rectangle([x0, y0, x1, y0+46], fill="#f3f5f8")
    d.rounded_rectangle([x0+86, y0+12, x1-20, y0+34], radius=11, fill="#fff", outline="#cdd5de", width=1)
    d.text((x0+100, y0+15), "github.com/uangl/cc", font=F_MS, fill="#333")
    # branch row
    d.text((x0+30, y0+70), "分支(branch):", font=F_SM, fill=GREY)
    d.rounded_rectangle([x0+150, y0+64, x0+460, y0+94], radius=8, fill="#eef1f5", outline="#cdd5de")
    d.text((x0+160, y0+68), "claude/friendly-wozniak-wsZ9B", font=F_MS, fill="#243240")
    # green Code button
    code = [x1-180, y0+64, x1-30, y0+98]
    d.rounded_rectangle(code, radius=8, fill="#2da44e")
    d.text((code[0]+30, code[1]+6), "Code", font=F_H, fill="#fff")
    d.polygon([(code[2]-36, code[1]+15), (code[2]-20, code[1]+15), (code[2]-28, code[1]+25)], fill="#fff")
    # dropdown
    dd = [x1-300, y0+104, x1-30, y0+220]
    d.rounded_rectangle([dd[0]+5, dd[1]+6, dd[2]+5, dd[3]+6], radius=10, fill="#d7dde5")
    d.rounded_rectangle(dd, radius=10, fill="#ffffff", outline="#cdd5de", width=2)
    d.text((dd[0]+20, dd[1]+16), "Clone", font=F_SM, fill=GREY)
    d.line([dd[0]+12, dd[1]+50, dd[2]-12, dd[1]+50], fill="#e6eaef")
    d.rounded_rectangle([dd[0]+8, dd[1]+58, dd[2]-8, dd[1]+100], radius=8, fill="#eafaef")
    d.text((dd[0]+20, dd[1]+68), "Download ZIP", font=F_BODY, fill="#1a7f37")
    d.rounded_rectangle([dd[0]+4, dd[1]+54, dd[2]-4, dd[1]+104], radius=10, outline=RED, width=4)
    arrow(d, (dd[0]-70, dd[1]+150), (dd[0]+10, dd[1]+80))
    bullets(d, 728, 150, [
        "打开你的仓库页面 github.com/uangl/cc",
        "确认分支是 claude/friendly-wozniak-wsZ9B",
        "点绿色「Code」→「Download ZIP」",
        "下载后在「下载」里双击解压",
        "把解压出的文件夹拖到「桌面」",
    ])
    tip(d, "解压出的文件夹名字可能较长（带 -claude... 后缀），不用改名，记住它在桌面即可。")
    img.save("/home/user/CC/guide_mac/s2_下载项目.png")

# ---------------- 3 终端 cd ----------------
def s3():
    img, d = newimg()
    band(d, 3, "打开「终端」，进入项目文件夹", "用「拖拽」代替手打长路径", "第 3 步 / 共 6 步")
    inner = window(d, [36, 124, 700, 612], "终端 — bash", body="#1e1f2b", bar="#3a3a44", tc="#ddd")
    x0, y0, x1, y1 = inner
    term_lines(d, inner, [
        [("Last login: Sun Jun  1 on ttys000", "#8a8aa0", False)],
        [(P_USER, "#5fd75f", True), ("cd ", "#ffffff", True)],
        [("", "#fff", False)],
    ])
    # folder icon being dragged
    fx, fy = x0+150, y0+120
    d.rounded_rectangle([fx, fy, fx+90, fy+66], radius=8, fill="#7cc0ff")
    d.rounded_rectangle([fx, fy, fx+38, fy+14], radius=6, fill="#7cc0ff")
    d.text((fx-4, fy+72), "cc 文件夹", font=F_SM, fill="#cfe6ff")
    arrow(d, (fx+10, fy-8), (x0+80, y0+60), "#ffd34d")
    d.text((fx-30, fy+96), "← 把它拖进窗口", font=F_BODY, fill="#ffd34d")
    bullets(d, 728, 150, [
        "按 Command + 空格，输入「终端」回车打开",
        "先输入 cd 和一个空格（cd 后面必须有空格）",
        "把桌面上的项目文件夹直接拖进终端窗口",
        "路径会自动填好，最后按一下回车",
    ])
    tip(d, "cd 是「进入文件夹」的意思。拖拽就是为了免去手打那一长串路径。")
    img.save("/home/user/CC/guide_mac/s3_终端进入.png")

# ---------------- 4 npm install + 打开配置 ----------------
def s4():
    img, d = newimg()
    band(d, 4, "安装依赖，并打开配置文件", "复制粘贴两行命令（各按一次回车）", "第 4 步 / 共 6 步")
    inner = window(d, [36, 124, 700, 612], "终端 — bash", body="#1e1f2b", bar="#3a3a44", tc="#ddd")
    x0, y0, x1, y1 = inner
    term_lines(d, inner, [
        [(P_USER, "#5fd75f", True), ("npm install", "#ffffff", True)],
        [("added 69 packages in 12s", "#8a8aa0", False)],
        [("", "#fff", False)],
        [(P_USER, "#5fd75f", True), ("cp .env.example .env && open -e .env", "#ffffff", True)],
        [("（自动弹出「文本编辑」打开 .env）", "#8a8aa0", False)],
    ])
    d.rounded_rectangle([x0+14, y0+12, x0+420, y0+44], radius=8, outline="#ffd34d", width=3)
    d.rounded_rectangle([x0+14, y0+104, x0+600, y0+136], radius=8, outline="#ffd34d", width=3)
    bullets(d, 728, 150, [
        "第①行：npm install —— 安装运行需要的组件，等它跑完",
        "第②行：cp .env.example .env && open -e .env",
        "②会把配置模板复制成 .env，并用「文本编辑」打开它",
        "粘贴用 Command + V，每行按一次回车",
    ])
    tip(d, "第一次 npm install 可能要等 1～2 分钟，出现 added ... packages 就成功了。")
    img.save("/home/user/CC/guide_mac/s4_安装依赖.png")

# ---------------- 5 填 Key ----------------
def s5():
    img, d = newimg()
    band(d, 5, "填入你的 API Key 并保存", "在「文本编辑」里改一行，然后 Command+S 保存", "第 5 步 / 共 6 步")
    inner = window(d, [36, 124, 700, 612], "文本编辑 — .env")
    x0, y0, x1, y1 = inner
    lines = [
        "PORT=3000",
        "",
        "AI_API_BASE=https://api.deepseek.com/v1",
        "AI_API_KEY=sk-你的新Key粘贴到这里",
        "AI_MODEL=deepseek-chat",
        "AI_TEMPERATURE=0.4",
        "",
        "ADMIN_TOKEN=",
    ]
    y = y0+24
    for i, ln in enumerate(lines):
        col = RED if ln.startswith("AI_API_KEY") else "#243240"
        if ln.startswith("AI_API_KEY"):
            d.rounded_rectangle([x0+16, y-4, x1-20, y+26], radius=6, fill="#fff3f3")
        draw_mixed(d, x0+24, y, ln, 18, col, ln.startswith("AI_API_KEY"))
        y += 32
    arrow(d, (x0+300, y0+24+3*32+78), (x0+330, y0+24+3*32+24))
    d.text((x0+120, y0+24+3*32+82), "把等号后面换成你的新 Key", font=F_SM, fill=RED)
    bullets(d, 728, 150, [
        "找到 AI_API_KEY= 这一行（红框）",
        "把等号后面整段换成 DeepSeek 新申请的 Key",
        "结果形如：AI_API_KEY=sk-abc123...",
        "按 Command + S 保存，再关闭窗口",
    ])
    tip(d, "等号前后不要留空格；Key 不要加引号。改完务必保存（Command+S）。")
    img.save("/home/user/CC/guide_mac/s5_填Key.png")

# ---------------- 6a 启动 ----------------
def s6a():
    img, d = newimg()
    band(d, 6, "启动服务：npm start", "回到终端运行，看到「AI 引擎」就成功了", "第 6 步 / 共 6 步")
    inner = window(d, [36, 124, 700, 612], "终端 — bash", body="#1e1f2b", bar="#3a3a44", tc="#ddd")
    x0, y0, x1, y1 = inner
    term_lines(d, inner, [
        [(P_USER, "#5fd75f", True), ("npm start", "#ffffff", True)],
        [("", "#fff", False)],
        [("混凝土配合比智能推荐工具 · 联网版", "#9ad0ff", False)],
        [("  本地访问:  http://localhost:3000", "#ffffff", False)],
        [("  中心台账:  未上传（首次需管理员上传）", "#e8e8e8", False)],
        [("  AI 引擎:   deepseek-chat @ ...deepseek.com", "#7CFFB0", True)],
    ])
    d.rounded_rectangle([x0+14, y0+158, x1-26, y0+190], radius=8, outline="#ffd34d", width=3)
    arrow(d, (x0+150, y0+222), (x0+120, y0+190), "#ffd34d")
    d.text((x0+160, y0+212), "出现这行 = Key 配好了", font=F_BODY, fill="#ffd34d")
    bullets(d, 728, 150, [
        "在终端输入 npm start 回车",
        "看到「AI 引擎: deepseek-chat ...」即成功",
        "这个终端窗口要一直开着，关掉=服务停止",
        "想停止：在终端按 Control + C",
    ])
    tip(d, "以后再用，只需重复：进入文件夹（第3步）→ npm start，两步即可。")
    img.save("/home/user/CC/guide_mac/s6a_启动.png")

# ---------------- 6b 浏览器 ----------------
def s6b():
    img, d = newimg()
    band(d, 6, "在浏览器查看：localhost:3000", "右上角「AI 引擎」变绿色「在线」就大功告成", "第 6 步 / 共 6 步")
    inner = window(d, [36, 124, 700, 612], "Safari — localhost:3000")
    x0, y0, x1, y1 = inner
    d.rectangle([x0, y0, x1, y0+46], fill="#f3f5f8")
    d.rounded_rectangle([x0+86, y0+12, x1-20, y0+34], radius=11, fill="#fff", outline="#cdd5de", width=1)
    d.text((x0+100, y0+15), "localhost:3000", font=F_MS, fill="#333")
    # app header
    d.rectangle([x0, y0+46, x1, y0+126], fill="#0f2740")
    wrap(d, x0+24, y0+62, "混凝土配合比智能推荐工具 · 联网版", F_H, 360, fill="#ffffff", lh=28)
    pill = [x1-238, y0+70, x1-24, y0+108]
    d.rounded_rectangle(pill, radius=18, fill="#103a2a", outline="#1f9d55", width=2)
    d.ellipse([pill[0]+16, pill[1]+13, pill[0]+28, pill[1]+25], fill="#28c840")
    d.text((pill[0]+38, pill[1]+8), "AI 引擎 在线", font=F_SM, fill="#7CFFB0")
    d.rounded_rectangle([pill[0]-6, pill[1]-6, pill[2]+6, pill[3]+6], radius=22, outline=RED, width=4)
    arrow(d, ((pill[0]+pill[2])/2, y0+170), ((pill[0]+pill[2])/2, pill[3]+10))
    d.text((pill[0]-60, y0+172), "绿色「在线」= 成功", font=F_BODY, fill=RED)
    # faint body
    d.text((x0+24, y0+210), "01 数据源   02 参数   03 推荐 …", font=F_SM, fill="#9aa7b4")
    bullets(d, 728, 150, [
        "打开浏览器，地址栏输入 localhost:3000",
        "右上角「AI 引擎」显示绿色「在线」即成功",
        "若显示红色/未配置：回终端按 Ctrl + C 停止，再检查第 5 步 .env 里的 Key，然后重新 npm start",
    ])
    tip(d, "到这一步，云端台账 + AI 智能研判就全部打通了。")
    img.save("/home/user/CC/guide_mac/s6b_浏览器.png")

for fn in (s0, s1, s2, s3, s4, s5, s6a, s6b):
    fn()
print("done")
