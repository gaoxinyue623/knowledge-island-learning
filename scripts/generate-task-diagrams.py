"""Regenerate exact companion diagrams without changing exercise answers.
Run from the repository root: python3 scripts/generate-task-diagrams.py
"""
import hashlib
import json
from pathlib import Path

OUT = Path('public/curriculum/generated-pictures')
META = Path('src/data/curriculum/generated-pictures/diagrams.json')
OUT.mkdir(parents=True, exist_ok=True)
META.parent.mkdir(parents=True, exist_ok=True)
entries = []

def text(x, y, value, size=30, extra=''):
    return f'<text x="{x}" y="{y}" font-size="{size}" {extra}>{value}</text>'

def panel(x, y, w, h, color='#ffffff'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="{color}" stroke="#d7e1d9" stroke-width="2"/>'

DEFS = '''<defs>
<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10" fill="#577969"/></marker>
<g id="duck"><ellipse cx="0" cy="10" rx="30" ry="19" fill="#fff0a8" stroke="#b1903b" stroke-width="2"/><circle cx="19" cy="-12" r="17" fill="#fff0a8" stroke="#b1903b" stroke-width="2"/><path d="M34,-15 L50,-10 L34,-5 Z" fill="#e99343"/><circle cx="24" cy="-16" r="3" fill="#384e45"/><path d="M-8,8 Q7,-3 17,10 Q4,22 -8,8" fill="#ead279"/></g>
<g id="rabbit"><ellipse cx="0" cy="0" rx="24" ry="26" fill="#f4e8d9" stroke="#927961" stroke-width="2"/><ellipse cx="-11" cy="-32" rx="8" ry="21" fill="#f4e8d9" stroke="#927961" stroke-width="2"/><ellipse cx="11" cy="-32" rx="8" ry="21" fill="#f4e8d9" stroke="#927961" stroke-width="2"/><circle cx="-8" cy="-4" r="3" fill="#384e45"/><circle cx="8" cy="-4" r="3" fill="#384e45"/><path d="M-3,4 L3,4 L0,9 Z" fill="#d58d88"/></g>
<g id="shape-arrow"><path d="M-48,-18 L10,-18 L10,-38 L52,0 L10,38 L10,18 L-48,18 Z" fill="currentColor" stroke="#385849" stroke-width="3"/></g>
<g id="cube"><path d="M0,-35 L40,-15 L0,5 L-40,-15 Z" fill="#f2d68d"/><path d="M-40,-15 L0,5 L0,48 L-40,28 Z" fill="#d8aa63"/><path d="M0,5 L40,-15 L40,28 L0,48 Z" fill="#ead099"/><path d="M0,-35 L40,-15 L40,28 L0,48 L-40,28 L-40,-15 Z M-40,-15 L0,5 L40,-15 M0,5 L0,48" fill="none" stroke="#8b7048" stroke-width="3"/></g>
</defs>'''

def save(key, node, title, alt, drawing, constraints, question_ids=(), lesson=True):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-labelledby="title desc">
<title id="title">{title}</title><desc id="desc">{alt}</desc>{DEFS}
<rect width="1200" height="800" fill="#f6f8f1"/><g font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif" fill="#304c3e">{drawing}</g></svg>'''
    file = OUT / (key + '.svg')
    file.write_text(svg)
    entries.append(dict(id='TASK_PICTURE_' + key.upper().replace('-', '_') + '_V1', nodeId=node, title=title, altText=alt, mode='deterministic SVG', url='/curriculum/generated-pictures/' + file.name, width=1200, height=800, sha256=hashlib.sha256(file.read_bytes()).hexdigest(), prompt='按题干条件使用 scripts/generate-task-diagrams.py 精确绘制：' + '；'.join(constraints), constraints=constraints, lesson=lesson, questionIds=list(question_ids)))

prefix = 'early-math-quest:v1:G1_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE:G1_SHENZHEN_MATH_S1_KP_12:'
drawing = text(60,85,'观察两组圆片',40) + panel(60,160,350,490,'#fff4ef') + panel(450,160,690,490,'#fffbea')
drawing += '<circle data-role="red-counter" cx="235" cy="400" r="70" fill="#dc6e62" stroke="#a4463c" stroke-width="4"/>'
for x in [590,795,1000]: drawing += f'<circle data-role="yellow-counter" cx="{x}" cy="400" r="70" fill="#f3ce63" stroke="#b4963e" stroke-width="4"/>'
save('counters', 'G1_SHENZHEN_MATH_S1_KP_12', '两组圆片', '左边一组1个红圆片，右边一组3个黄圆片。', drawing, ['红圆片1个','黄圆片3个','两组之间留空，无总数标签'], [prefix+'1',prefix+'3'])

drawing = text(60,70,'美丽的田园',40) + panel(60,115,1080,245,'#dcf0f5') + text(90,165,'水里') + panel(60,395,1080,340,'#e6efdc') + text(90,445,'岸上')
for x in [300,465,630,795,960]: drawing += f'<use data-role="water-duck" href="#duck" x="{x}" y="255"/>'
for y in [495,580,665]:
    for x in [360,610,860]: drawing += f'<use data-role="shore-duck" href="#duck" x="{x}" y="{y}"/>'
save('ducks', 'G1_SHENZHEN_MATH_S2_KP_16', '田园里的鸭子', '上方水里5只鸭子，下方岸上9只鸭子，两处合计14只。', drawing, ['水里5只','岸上9只','不标总数或算式'], ['lower-math-quest:v1:G1_SHENZHEN_BNU_MATH_S2_2024_CANDIDATE:G1_SHENZHEN_MATH_S2_KP_16:1'])

drawing = text(60,75,'动物聚会',40) + text(60,125,'先观察桌旁的小动物，再看后来发生了什么。',28)
for x in [310,855]:
    for y in [275,465]:
        drawing += f'<ellipse data-role="table" cx="{x}" cy="{y}" rx="105" ry="56" fill="#d8bc8b" stroke="#9c815d" stroke-width="3"/>'
        for animal_x in [x-150,x+150]: drawing += f'<use data-role="seated-animal" href="#rabbit" x="{animal_x}" y="{y}"/>'
drawing += panel(60,605,1080,145,'#fff2dc') + text(100,675,'后来又来 1 只') + '<use data-role="arriving-animal" href="#rabbit" x="630" y="683"/>'
save('animal-party','G2_SHENZHEN_MATH_S1_KP_16','动物聚会情景','4张桌子，每桌2只小动物；下方单独表示后来又来1只。',drawing,['4张桌子','每桌2只，原来8只','后来1只在独立区域'],[])

prefix = 'math-quest:v1:G2_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE:G2_SHENZHEN_MATH_S1_KP_16:'
drawing = text(60,80,'观察点阵',40)+panel(100,135,1000,590)
for y in [235,365,495,625]:
    for x in [440,760]: drawing += f'<circle data-role="array-dot" cx="{x}" cy="{y}" r="40" fill="#72a18d" stroke="#3b6f59" stroke-width="3"/>'
save('dot-array','G2_SHENZHEN_MATH_S1_KP_16','点阵图','4行圆点，每行2个，行距、列距相等。',drawing,['4行','每行2个','无额外小动物或答案算式'],[prefix+'1',prefix+'2'],False)

drawing=text(60,75,'比较位置、朝向与对称',40)
for x in [40,425,810]: drawing+=panel(x,145,350,570)
drawing+=text(215,205,'平移',32,'text-anchor="middle"')+'<use href="#shape-arrow" x="130" y="370" color="#9cc4ae"/><use href="#shape-arrow" x="285" y="370" color="#e5b759"/><path d="M130,470 H285" stroke="#577969" stroke-width="4" marker-end="url(#arrowhead)"/>'
drawing+=text(600,205,'旋转',32,'text-anchor="middle"')+'<circle cx="600" cy="435" r="7" fill="#304c3e"/><use href="#shape-arrow" transform="translate(600 435) translate(0 -125)" color="#9cc4ae"/><use href="#shape-arrow" transform="translate(600 435) rotate(90) translate(0 -125)" color="#e5b759"/><path d="M600,260 A175,175 0 0 1 775,435" stroke="#577969" stroke-width="4" fill="none" marker-end="url(#arrowhead)"/>'
drawing+=text(985,205,'轴对称',32,'text-anchor="middle"')+'<path d="M980,420 C820,245 820,620 980,480 Z M990,420 C1150,245 1150,620 990,480 Z" fill="#c3a3cf" stroke="#8d6b99" stroke-width="3"/><rect x="979" y="355" width="12" height="160" rx="6" fill="#6f6076"/><path d="M985,275 V640" stroke="#577969" stroke-width="3" stroke-dasharray="10 8"/>'
save('shape-motion','G2_SHENZHEN_MATH_S1_KP_33','图形运动与轴对称','三个独立区域：朝向不变的平移、绕固定中心转动的旋转、两侧镜像的轴对称。',drawing,['平移前后朝向相同','旋转绕明确中心顺时针90度','对称图两侧镜像'],[])

drawing=text(60,75,'观察前后两次位置',40)+panel(80,140,1040,590)+'<circle cx="540" cy="480" r="8" fill="#304c3e"/><use href="#shape-arrow" transform="translate(540 480) translate(0 -230)" color="#9cc4ae"/><use href="#shape-arrow" transform="translate(540 480) rotate(90) translate(0 -230)" color="#e5b759"/><path d="M540,190 A290,290 0 0 1 830,480" stroke="#577969" stroke-width="4" fill="none" marker-end="url(#arrowhead)"/>'+text(420,245,'之前',26)+text(770,555,'之后',26)+text(455,535,'固定点',26)
save('rotation-question','G2_SHENZHEN_MATH_S1_KP_33','图形变化示意','箭头绕固定点顺时针转过四分之一圈，转动前后的位置和朝向用不同颜色区分。',drawing,['中心位置不变','图形大小不变','顺时针90度','不直接写运动名称'],['math-quest:v1:G2_SHENZHEN_BNU_MATH_S1_2024_CANDIDATE:G2_SHENZHEN_MATH_S1_KP_33:1'],False)

drawing=text(600,65,'兴趣小组人数统计图',38,'text-anchor="middle"')+text(70,130,'人数（人）',26)
for value in range(0,15,2):
    y=650-value*35
    drawing+=f'<path d="M160,{y} H1100" stroke="#d6e1dc" stroke-width="2"/>'+text(135,y+9,str(value),26,'text-anchor="end"')
drawing+='<path d="M160,155 V650 H1100" fill="none" stroke="#527565" stroke-width="4"/>'
for x,name,value,color in [(285,'绘画',8,'#79a890'),(565,'音乐',12,'#e2b963'),(845,'棋类',6,'#82adc6')]:
    drawing+=f'<rect data-category="{name}" data-value="{value}" x="{x}" y="{650-value*35}" width="150" height="{value*35}" fill="{color}"/>'+text(x+75,700,name,30,'text-anchor="middle"')
drawing+=text(600,760,'每一格表示 2 人',27,'text-anchor="middle"')
save('bar-chart','G4_BNU_MATH_S1_2022_KP_22','条形统计图','绘画8人、音乐12人、棋类6人，纵轴从0至14，每格2人。',drawing,['绘画8人','音乐12人','棋类6人','纵轴从0起每格2人','不在条上标出读取答案'],['G4_BNU_MATH_S1_2022_KP_22_Q1','G4_BNU_MATH_S1_2022_KP_22_Q2'])

drawing=text(60,65,'在方格纸上按要求平移三角形',38)+text(60,115,'列向右增加，行向上增加；向右平移 4 格。',27)
# grid coordinate origin at (180,650), one square 100 px
for x in range(9): drawing+=f'<path d="M{180+x*100},250 V650" stroke="#c9d8d0" stroke-width="2"/>'+text(180+x*100,695,str(x),26,'text-anchor="middle"')
for y in range(5): drawing+=f'<path d="M180,{650-y*100} H980" stroke="#c9d8d0" stroke-width="2"/>'+text(155,650-y*100+9,str(y),26,'text-anchor="end"')
drawing+='<polygon data-role="original-triangle" data-coordinates="1,1 1,3 3,1" points="280,550 280,350 480,550" fill="#c8e2d4" stroke="#4c876b" stroke-width="4"/>'
for label,x,y in [('A',1,1),('B',1,3),('C',3,1)]: drawing+=f'<circle cx="{180+x*100}" cy="{650-y*100}" r="6" fill="#345b46"/>'+text(180+x*100+15,650-y*100-18,f'{label}({x},{y})',26)
drawing+=text(1040,695,'列',26)+text(140,220,'行',26)
save('triangle-translation','G5_BNU_MATH_S1_USER_KP_19','三角形平移练习','三角形A(1,1)、B(1,3)、C(3,1)，列向右、行向上增加；只绘制原图，不给出平移后的答案。',drawing,['A(1,1)','B(1,3)','C(3,1)','向右4格','只显示原图'],['G5_BNU_MATH_S1_USER_KP_19_SYNC_V1_09'])

drawing=text(60,65,'按条件摆放小正方体',38)+text(60,115,'仅一层，每格最多 1 个；从第 1 行前方观察。',27)+panel(50,160,630,555)+panel(720,160,430,555)
for row in [1,2]:
    for col in [1,2]:
        x=180+(col-1)*180;y=490-(row-1)*180
        drawing+=f'<rect data-role="placement-cell" data-row="{row}" data-col="{col}" x="{x}" y="{y}" width="180" height="180" fill="white" stroke="#729985" stroke-width="3"/>'+text(x+90,y+100,f'({col},{row})',28,'text-anchor="middle"')
drawing+=text(365,235,'摆放区域（列，行）',28,'text-anchor="middle"')+text(365,760,'从这里向上看',27,'text-anchor="middle"')+'<path d="M365,725 V675" stroke="#577969" stroke-width="4" marker-end="url(#arrowhead)"/>'+text(935,215,'使用这些小正方体',27,'text-anchor="middle"')
for x in [805,935,1065]: drawing+=f'<use data-role="loose-cube" href="#cube" x="{x}" y="310"/>'
drawing+=text(935,460,'要求看到的正面图',27,'text-anchor="middle"')
for x in [855,935]: drawing+=f'<rect data-role="front-square" x="{x}" y="500" width="80" height="80" fill="#efd49d" stroke="#8b7048" stroke-width="3"/>'
drawing+=text(935,660,'在左边方格中想一想怎样摆。',23,'text-anchor="middle"')
save('cube-views','G6_BNU_MATH_S1_2022_KP_24','正面图与摆放区域','空的2×2摆放区域，第1行在下方；3个待摆放的同样大小正方体；正面图为并排的2个正方形。',drawing,['2×2空格','第1行靠观察者','每格最多1个，仅一层','3个待摆方块','正面图2个并排正方形','不画任何一种答案摆法'],['G6_BNU_MATH_S1_2022_KP_24_SYNC_V1_08'])
# The return-route question is also shown independently of the preceding item.
drawing=text(60,70,'方向与路线',40)+text(60,120,'去程：先向东 200 米，再向北 300 米。',28)+panel(60,165,1080,570)
drawing+='<path d="M360,650 H660 V200" fill="none" stroke="#79aa91" stroke-width="12" stroke-linejoin="round"/>'
drawing+='<path d="M445,650 H555" fill="none" stroke="#416b54" stroke-width="4" marker-end="url(#arrowhead)"/>'
drawing+='<path d="M660,535 V385" fill="none" stroke="#416b54" stroke-width="4" marker-end="url(#arrowhead)"/>'
for x,y in [(360,650),(660,650),(660,200)]: drawing+=f'<circle cx="{x}" cy="{y}" r="12" fill="white" stroke="#426a54" stroke-width="4"/>'
drawing+=text(315,705,'家',30)+text(710,210,'图书馆',30)+text(510,705,'200 米',32,'text-anchor="middle"')+text(705,455,'300 米',32)
drawing+='<path d="M1030,320 V220" fill="none" stroke="#577969" stroke-width="4" marker-end="url(#arrowhead)"/>'+text(1030,200,'北',30,'text-anchor="middle"')
save('community-route','G4_BNU_MATH_S1_2022_KP_13','往返路线示意','从家先向东200米，再向北300米到图书馆；图右侧标出北向。仅标去程，不画返回答案。',drawing,['先向东200米','再向北300米','北向朝上','仅标去程，不给出返程答案'],['G4_BNU_MATH_S1_2022_KP_13_Q2','G4_BNU_MATH_S1_2022_KP_13_Q3'])

META.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
manifest_path = META.with_name('manifest.json')
if manifest_path.exists():
    manifest = json.loads(manifest_path.read_text())
    manifest['images'] = [entry for entry in manifest['images'] if entry['mode'] != 'deterministic SVG'] + entries
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Wrote {len(entries)} exact diagrams and refreshed the manifest.')
