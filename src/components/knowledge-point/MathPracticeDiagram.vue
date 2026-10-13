<script setup lang="ts">
import { computed } from 'vue'
import { TANGRAM_PIECES } from '@/data/content-expansion/math-lower-visuals'
import type { MathPracticeDiagram } from '@/types/math-practice'
const props = defineProps<{ diagram: MathPracticeDiagram }>()
const d = computed(() => props.diagram)
const maxValue = computed(() =>
  d.value.kind === 'bars' || d.value.kind === 'line'
    ? Math.ceil(Math.max(...d.value.values, ...(d.value.second ?? [])) / 5) * 5
    : 1,
)
const points = (values: number[]) =>
  values.map((v, i) => `${120 + i * 120},${225 - (v / maxValue.value) * 150}`).join(' ')
const radians = (degrees: number) => (degrees * Math.PI) / 180
const netCells = [
  [1, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [1, 2],
  [1, 3],
]
const caption = computed(() =>
  d.value.kind === 'cards'
    ? d.value.caption
    : d.value.kind === 'bars' || d.value.kind === 'line'
      ? (d.value.second ? '绿色：第一组；黄色：第二组。' : '') + '根据刻度和标注读取数据。'
      : d.value.kind === 'clock'
        ? '观察时针与分针的位置。'
        : d.value.kind === 'motion'
          ? '观察图形的朝向、位置或镜像关系。'
          : '示意图；按标注的数据判断，不用尺子量屏幕。',
)
const description = computed(() => {
  const v = d.value
  if (v.kind === 'bars' || v.kind === 'line')
    return v.labels
      .map(
        (label, i) =>
          `${label}：绿色${v.values[i]}${v.unit}${v.second ? `，黄色${v.second[i]}${v.unit}` : ''}`,
      )
      .join('；')
  if (v.kind === 'grid')
    return `${v.columns}列${v.rows}行的方格图${v.marked ? `，标记点数对为${v.marked.map((p) => p.join('，')).join('；')}` : ''}`
  if (v.kind === 'cubes')
    return `仅一行的三列小正方体，各列高${v.heights.join('、')}个，正面在图下方`
  if (v.kind === 'fraction') return `平均分成${v.parts}份，涂色${v.shaded}份`
  if (v.kind === 'circle')
    return `圆的半径${v.radius}${v.unit}${v.outer ? `，外半径${v.outer}${v.unit}` : ''}`
  if (v.kind === 'solid')
    return `${v.shape === 'cuboid' ? '长方体' : v.shape === 'cylinder' ? '圆柱' : '圆锥'}，${v.shape === 'cuboid' ? `长${v.a}，宽${v.b}，高${v.c}` : `${v.baseArea ? `底面积${v.baseArea}` : `半径${v.a}`}，高${v.c}`}，单位${v.unit}`
  if (v.kind === 'angle') return `两条射线的夹角为${v.degrees}度`
  if (v.kind === 'clock') return `时针和分针表示${v.hour}时${v.minute}分`
  if (v.kind === 'route')
    return `上北下南；大门向北${v.first}${v.unit}到路口，再向东${v.second}${v.unit}到图书馆`
  if (v.kind === 'cards') return v.labels.join('；')
  if (v.kind === 'viewpoints') return '长方体和两个观察位置：甲在物体正面，乙在物体右面'
  if (v.kind === 'tangram') return '七块纸片拼成正方形，编号是纸片标记'
  if (v.kind === 'compass-turn')
    return `初始朝${['北', '东', '南', '西'][v.start]}，顺时针旋转${v.quarterTurns * 90}度的示意图`
  if (v.kind === 'net') return '六个正方形组成的十字形正方体展开图'
  if (v.kind === 'motion')
    return v.mode === 'translation'
      ? '两个箭头朝向相同，水平移动'
      : v.mode === 'rotation'
        ? '箭头绕中心转过直角'
        : '两边图形沿中间虚线互为镜像'
  if (v.kind === 'ruler') return `线段从${v.start}厘米到${v.end}厘米`
  if ('width' in v)
    return `图形底${v.width}${v.unit}，对应的高${v.height}${v.unit}${v.kind === 'trapezoid' ? `，上底${v.top}${v.unit}` : ''}`
  return '数学示意图'
})
</script>
<template>
  <div class="math-practice-figure">
    <svg viewBox="0 0 500 300" role="img" :aria-label="description">
      <template
        v-if="
          d.kind === 'rectangle' ||
          d.kind === 'parallelogram' ||
          d.kind === 'triangle' ||
          d.kind === 'trapezoid'
        "
      >
        <path
          :d="
            d.kind === 'rectangle'
              ? 'M130 75H370V220H130Z'
              : d.kind === 'parallelogram'
                ? 'M160 75H400L340 220H100Z'
                : d.kind === 'triangle'
                  ? 'M100 220L250 55L400 220Z'
                  : 'M170 75H330L400 220H100Z'
          "
          fill="#dbeedc"
          stroke="#52735a"
          stroke-width="3"
        />
        <line
          x1="250"
          y1="220"
          x2="250"
          :y2="d.kind === 'triangle' ? 55 : 75"
          stroke="#447ba0"
          stroke-dasharray="7 5"
          stroke-width="3"
        />
        <path d="M250 204H266V220" fill="none" stroke="#447ba0" stroke-width="2" />
        <text x="250" y="251" text-anchor="middle">{{ d.width }}{{ d.unit }}</text>
        <text x="275" y="153">{{ d.height }}{{ d.unit }}</text>
        <text v-if="d.kind === 'trapezoid'" x="250" y="51" text-anchor="middle">
          {{ d.top }}{{ d.unit }}
        </text>
      </template>
      <template v-else-if="d.kind === 'circle'">
        <circle cx="250" cy="150" r="105" fill="#dbeedc" stroke="#52735a" stroke-width="3" />
        <circle
          v-if="d.outer"
          cx="250"
          cy="150"
          :r="(105 * d.radius) / d.outer"
          fill="#fffdf4"
          stroke="#52735a"
          stroke-width="2"
        />
        <circle cx="250" cy="150" r="4" fill="#52735a" />
        <line
          x1="250"
          y1="150"
          :x2="250 + (d.outer ? (105 * d.radius) / d.outer : 105)"
          y2="150"
          stroke="#447ba0"
          stroke-width="3"
        />
        <text x="250" y="283" text-anchor="middle">
          {{ d.outer ? '内半径' : '半径' }} {{ d.radius }}{{ d.unit
          }}{{ d.outer ? `；外半径 ${d.outer}${d.unit}` : '' }}
        </text>
      </template>
      <template v-else-if="d.kind === 'solid'">
        <template v-if="d.shape === 'cuboid'">
          <path d="M120 110L190 55H370L300 110Z" fill="#edf6de" stroke="#52735a" stroke-width="3" />
          <path d="M120 110H300V230H120Z" fill="#dbeedc" stroke="#52735a" stroke-width="3" />
          <path d="M300 110L370 55V175L300 230Z" fill="#b7d4c5" stroke="#52735a" stroke-width="3" />
          <text x="205" y="257" text-anchor="middle">长 {{ d.a }}{{ d.unit }}</text>
          <text x="357" y="213" text-anchor="middle">宽 {{ d.b }}{{ d.unit }}</text>
          <text x="90" y="170" text-anchor="end">高 {{ d.c }}</text>
        </template>
        <template v-else>
          <path
            v-if="d.shape === 'cylinder'"
            d="M160 85V220A90 24 0 0 0 340 220V85"
            fill="#dbeedc"
            stroke="#52735a"
            stroke-width="3"
          />
          <path
            v-else
            d="M250 50L160 220A90 24 0 0 0 340 220Z"
            fill="#dbeedc"
            stroke="#52735a"
            stroke-width="3"
          />
          <ellipse
            v-if="d.shape === 'cylinder'"
            cx="250"
            cy="85"
            rx="90"
            ry="24"
            fill="#edf6de"
            stroke="#52735a"
            stroke-width="3"
          />
          <ellipse
            cx="250"
            cy="220"
            rx="90"
            ry="24"
            fill="none"
            stroke="#52735a"
            stroke-dasharray="6 4"
          />
          <line
            v-if="!d.baseArea"
            x1="250"
            y1="220"
            x2="340"
            y2="220"
            stroke="#447ba0"
            stroke-width="2"
          />
          <text x="365" y="155">高 {{ d.c }}{{ d.unit }}</text>
          <text x="250" y="278" text-anchor="middle">
            {{ d.baseArea ? `底面积 ${d.baseArea} 平方${d.unit}` : `半径 ${d.a}${d.unit}` }}
          </text>
        </template>
      </template>
      <template v-else-if="d.kind === 'bars' || d.kind === 'line'">
        <template v-for="i in 6" :key="i">
          <line
            x1="80"
            x2="440"
            :y1="225 - (i - 1) * 30"
            :y2="225 - (i - 1) * 30"
            stroke="#d2dfd1"
          />
          <text x="65" :y="231 - (i - 1) * 30" text-anchor="end">
            {{ ((i - 1) * maxValue) / 5 }}
          </text>
        </template>
        <path d="M80 60V225H450" fill="none" stroke="#52735a" stroke-width="2" />
        <text x="80" y="42">单位：{{ d.unit }}</text>
        <polyline
          v-if="d.kind === 'line'"
          :points="points(d.values)"
          fill="none"
          stroke="#52735a"
          stroke-width="4"
        />
        <polyline
          v-if="d.kind === 'line' && d.second"
          :points="points(d.second)"
          fill="none"
          stroke="#d0a443"
          stroke-width="4"
        />
        <template v-for="(value, i) in d.values" :key="i">
          <rect
            v-if="d.kind === 'bars'"
            :x="100 + i * 120"
            :y="225 - (value / maxValue) * 150"
            :width="d.second ? 25 : 40"
            :height="(value / maxValue) * 150"
            fill="#72a88a"
          />
          <rect
            v-if="d.kind === 'bars' && d.second"
            :x="130 + i * 120"
            :y="225 - (d.second[i]! / maxValue) * 150"
            width="25"
            :height="(d.second[i]! / maxValue) * 150"
            fill="#e6c471"
          />
          <circle
            v-if="d.kind === 'line'"
            :cx="120 + i * 120"
            :cy="225 - (value / maxValue) * 150"
            r="5"
            fill="#52735a"
          />
          <text
            :x="d.second && d.kind === 'bars' ? 112 + i * 120 : 120 + i * 120"
            :y="(d.kind === 'line' && d.second ? 243 : 219) - (value / maxValue) * 150"
            text-anchor="middle"
            font-size="14"
          >
            {{ value }}
          </text>
          <text
            v-if="d.second"
            :x="d.kind === 'bars' ? 143 + i * 120 : 120 + i * 120"
            :y="
              d.kind === 'bars'
                ? 219 - (d.second[i]! / maxValue) * 150
                : 213 - (d.second[i]! / maxValue) * 150
            "
            text-anchor="middle"
            font-size="14"
          >
            {{ d.second[i] }}
          </text>
          <text :x="120 + i * 120" y="256" text-anchor="middle">{{ d.labels[i] }}</text>
        </template>
      </template>
      <template v-else-if="d.kind === 'fraction'">
        <template v-if="d.circular">
          <circle cx="250" cy="150" r="100" fill="#fffdf4" stroke="#52735a" stroke-width="2" />
          <path
            :d="`M250 150L250 50A100 100 0 ${d.shaded > d.parts / 2 ? 1 : 0} 1 ${250 + 100 * Math.sin(radians((360 * d.shaded) / d.parts))} ${150 - 100 * Math.cos(radians((360 * d.shaded) / d.parts))}Z`"
            fill="#9ccdb0"
          />
          <line
            v-for="i in d.parts"
            :key="i"
            x1="250"
            y1="150"
            :x2="250 + 100 * Math.sin(radians((360 * i) / d.parts))"
            :y2="150 - 100 * Math.cos(radians((360 * i) / d.parts))"
            stroke="#52735a"
            stroke-width="2"
          />
        </template>
        <template v-else>
          <rect
            x="45"
            y="100"
            width="410"
            height="90"
            fill="#fffdf4"
            stroke="#52735a"
            stroke-width="2"
          />
          <rect x="45" y="100" :width="(410 * d.shaded) / d.parts" height="90" fill="#9ccdb0" />
          <line
            v-for="i in d.parts - 1"
            :key="i"
            :x1="45 + (410 * i) / d.parts"
            :x2="45 + (410 * i) / d.parts"
            y1="100"
            y2="190"
            stroke="#52735a"
            stroke-width="2"
          />
        </template>
        <text x="250" :y="d.circular ? 285 : 240" text-anchor="middle">
          整个{{ d.circular ? '圆' : '长条' }}表示一个整体，平均分成 {{ d.parts }} 份
        </text>
      </template>
      <template v-else-if="d.kind === 'grid'">
        <template v-for="row in d.rows" :key="row">
          <rect
            v-for="column in d.columns"
            :key="column"
            :x="80 + ((column - 1) * 330) / d.columns"
            :y="35 + ((d.rows - row) * 200) / d.rows"
            :width="330 / d.columns"
            :height="200 / d.rows"
            fill="#edf6de"
            stroke="#7a9b7a"
          />
        </template>
        <template v-if="d.labels">
          <text
            v-for="column in d.columns"
            :key="column"
            :x="80 + ((column - 0.5) * 330) / d.columns"
            y="261"
            text-anchor="middle"
          >
            {{ column }}
          </text>
          <text
            v-for="row in d.rows"
            :key="row"
            x="60"
            :y="35 + ((d.rows - row + 0.5) * 200) / d.rows + 6"
            text-anchor="middle"
          >
            {{ row }}
          </text>
          <text x="430" y="260">列</text>
          <text x="42" y="23">行</text>
        </template>
        <g v-for="(mark, i) in d.marked ?? []" :key="i">
          <circle
            :cx="80 + ((mark[0] - 0.5) * 330) / d.columns"
            :cy="35 + ((d.rows - mark[1] + 0.5) * 200) / d.rows"
            r="10"
            fill="#d19352"
          />
          <text
            :x="100 + ((mark[0] - 0.5) * 330) / d.columns"
            :y="39 + ((d.rows - mark[1] + 0.5) * 200) / d.rows"
          >
            {{ String.fromCharCode(65 + i) }}
          </text>
        </g>
      </template>
      <template v-else-if="d.kind === 'angle'">
        <path
          :d="`M240 225L425 225M240 225L${240 + 185 * Math.cos(radians(d.degrees))} ${225 - 185 * Math.sin(radians(d.degrees))}`"
          fill="none"
          stroke="#52735a"
          stroke-width="4"
        />
        <path
          :d="`M300 225A60 60 0 0 0 ${240 + 60 * Math.cos(radians(d.degrees))} ${225 - 60 * Math.sin(radians(d.degrees))}`"
          fill="none"
          stroke="#d0a443"
          stroke-width="3"
        />
        <text x="315" y="190">{{ d.degrees }}°</text>
      </template>
      <template v-else-if="d.kind === 'clock'">
        <circle cx="250" cy="145" r="110" fill="#fffdf4" stroke="#52735a" stroke-width="3" />
        <text
          v-for="i in 12"
          :key="i"
          :x="250 + 90 * Math.sin(radians(i * 30))"
          :y="151 - 90 * Math.cos(radians(i * 30))"
          text-anchor="middle"
        >
          {{ i }}
        </text>
        <line
          x1="250"
          y1="145"
          :x2="250 + 55 * Math.sin(radians(d.hour * 30 + d.minute * 0.5))"
          :y2="145 - 55 * Math.cos(radians(d.hour * 30 + d.minute * 0.5))"
          stroke="#52735a"
          stroke-width="7"
          stroke-linecap="round"
        />
        <line
          x1="250"
          y1="145"
          :x2="250 + 82 * Math.sin(radians(d.minute * 6))"
          :y2="145 - 82 * Math.cos(radians(d.minute * 6))"
          stroke="#447ba0"
          stroke-width="4"
          stroke-linecap="round"
        />
        <circle cx="250" cy="145" r="5" fill="#52735a" />
      </template>
      <template v-else-if="d.kind === 'route'">
        <path d="M120 225V75H380" fill="none" stroke="#72a88a" stroke-width="9" />
        <g fill="#fffdf4" stroke="#52735a" stroke-width="3">
          <circle cx="120" cy="225" r="8" />
          <circle cx="120" cy="75" r="8" />
          <circle cx="380" cy="75" r="8" />
        </g>
        <text x="120" y="267" text-anchor="middle">大门</text>
        <text x="120" y="46" text-anchor="middle">路口</text>
        <text x="380" y="46" text-anchor="middle">图书馆</text>
        <text x="34" y="160">{{ d.first }}{{ d.unit }}</text>
        <text x="250" y="100" text-anchor="middle">{{ d.second }}{{ d.unit }}</text>
        <path
          d="M455 175V120M446 135L455 120L464 135"
          fill="none"
          stroke="#52735a"
          stroke-width="3"
        />
        <text x="455" y="106" text-anchor="middle">北</text>
      </template>
      <template v-else-if="d.kind === 'cubes'">
        <template v-for="(height, column) in d.heights" :key="column">
          <g v-for="level in height" :key="level">
            <path
              :d="`M${100 + column * 100} ${230 - level * 34}l18 -14h60l-18 14z`"
              fill="#e4f0dc"
              stroke="#52735a"
            />
            <path
              :d="`M${160 + column * 100} ${230 - level * 34}l18 -14v34l-18 14z`"
              fill="#adccba"
              stroke="#52735a"
            />
            <rect
              :x="100 + column * 100"
              :y="230 - level * 34"
              width="60"
              height="34"
              fill="#cce5d2"
              stroke="#52735a"
            />
          </g>
          <text :x="130 + column * 100" y="254" text-anchor="middle">{{ height }}层</text>
        </template>
        <text x="250" y="285" text-anchor="middle">正面 · 仅排一行</text>
      </template>
      <template v-else-if="d.kind === 'tangram'">
        <g v-for="piece in TANGRAM_PIECES" :key="piece.id">
          <polygon
            :points="piece.points.map(([x, y]) => `${150 + x * 45},${50 + y * 45}`).join(' ')"
            :fill="piece.color"
            stroke="#52735a"
            stroke-width="2"
          />
          <text
            :x="150 + piece.labelPosition[0] * 45"
            :y="55 + piece.labelPosition[1] * 45"
            text-anchor="middle"
            font-size="15"
          >
            {{ piece.id }}
          </text>
        </g>
      </template>
      <template v-else-if="d.kind === 'compass-turn'">
        <text x="250" y="28" text-anchor="middle">北</text>
        <text x="435" y="155" text-anchor="middle">东</text>
        <text x="250" y="278" text-anchor="middle">南</text>
        <text x="65" y="155" text-anchor="middle">西</text>
        <path d="M250 40V255M95 150H405" stroke="#c9d8c8" stroke-dasharray="4 4" />
        <path
          d="M250 150V65M242 77L250 65L258 77"
          :transform="`rotate(${d.start * 90} 250 150)`"
          fill="none"
          stroke="#52735a"
          stroke-width="4"
        />
        <path
          :d="`M${250 + 65 * Math.sin(radians(d.start * 90))} ${150 - 65 * Math.cos(radians(d.start * 90))}A65 65 0 ${d.quarterTurns > 2 ? 1 : 0} 1 ${250 + 65 * Math.sin(radians((d.start + d.quarterTurns) * 90))} ${150 - 65 * Math.cos(radians((d.start + d.quarterTurns) * 90))}`"
          fill="none"
          stroke="#ce9c4b"
          stroke-width="3"
        />
        <circle cx="250" cy="150" r="4" fill="#52735a" />
        <text x="250" y="297" text-anchor="middle" font-size="16">
          绿色箭头为初始方向；顺时针转 {{ d.quarterTurns * 90 }}°
        </text>
      </template>
      <template v-else-if="d.kind === 'viewpoints'">
        <path d="M180 90L230 55H360L310 90Z" fill="#edf6de" stroke="#52735a" stroke-width="3" />
        <path d="M180 90H310V210H180Z" fill="#dbeedc" stroke="#52735a" stroke-width="3" />
        <path d="M310 90L360 55V175L310 210Z" fill="#b7d4c5" stroke="#52735a" stroke-width="3" />
        <ellipse
          cx="250"
          cy="265"
          rx="15"
          ry="8"
          fill="#fffdf4"
          stroke="#447ba0"
          stroke-width="2"
        />
        <circle cx="250" cy="265" r="3" fill="#447ba0" />
        <path
          d="M250 251V224M243 237L250 224L257 237"
          fill="none"
          stroke="#447ba0"
          stroke-width="3"
        />
        <text x="250" y="294" text-anchor="middle">甲：正面</text>
        <ellipse
          cx="440"
          cy="130"
          rx="15"
          ry="8"
          fill="#fffdf4"
          stroke="#c09a49"
          stroke-width="2"
        />
        <circle cx="440" cy="130" r="3" fill="#c09a49" />
        <path
          d="M423 130H372M385 123L372 130L385 137"
          fill="none"
          stroke="#c09a49"
          stroke-width="3"
        />
        <text x="435" y="166" text-anchor="middle">乙：右面</text>
      </template>
      <template v-else-if="d.kind === 'net'">
        <rect
          v-for="(cell, i) in netCells"
          :key="i"
          :x="145 + cell[0]! * 55"
          :y="25 + cell[1]! * 55"
          width="55"
          height="55"
          fill="#dbeedc"
          stroke="#52735a"
          stroke-width="2"
        />
      </template>
      <template v-else-if="d.kind === 'cards'">
        <g v-for="(label, i) in d.labels" :key="i">
          <rect
            :x="20 + (i * 460) / d.labels.length"
            y="100"
            :width="440 / d.labels.length"
            height="80"
            rx="8"
            fill="#e4f0dc"
            stroke="#7a9b7a"
          />
          <text
            :x="20 + ((i + 0.48) * 460) / d.labels.length"
            y="148"
            text-anchor="middle"
            font-size="18"
          >
            {{ label }}
          </text>
        </g>
      </template>
      <template v-else-if="d.kind === 'motion'">
        <path
          d="M60 150L110 105V130H170V170H110V195Z"
          fill="#87b699"
          stroke="#52735a"
          stroke-width="2"
        />
        <path
          :d="
            d.mode === 'translation'
              ? 'M300 150L350 105V130H410V170H350V195Z'
              : d.mode === 'rotation'
                ? 'M335 55L380 105H355V165H315V105H290Z'
                : 'M420 150L370 105V130H310V170H370V195Z'
          "
          fill="#e3c06e"
          stroke="#a48c50"
          stroke-width="2"
        />
        <g v-if="d.mode === 'rotation'">
          <circle cx="245" cy="240" r="4" fill="#447ba0" />
          <text x="245" y="274" text-anchor="middle" font-size="15">旋转中心</text>
        </g>
        <line
          v-if="d.mode === 'reflection'"
          x1="240"
          y1="60"
          x2="240"
          y2="240"
          stroke="#447ba0"
          stroke-dasharray="7 5"
          stroke-width="3"
        />
        <path
          v-else-if="d.mode === 'rotation'"
          d="M60 150A206 206 0 0 1 335 55"
          fill="none"
          stroke="#447ba0"
          stroke-width="3"
        />
        <path
          v-else
          d="M205 150H270L258 141M270 150L258 159"
          fill="none"
          stroke="#447ba0"
          stroke-width="3"
        />
      </template>
      <template v-else-if="d.kind === 'ruler'">
        <rect x="30" y="140" width="440" height="80" rx="8" fill="#f4e5b8" stroke="#b09a61" />
        <g v-for="i in d.max + 1" :key="i">
          <line
            :x1="50 + ((i - 1) * 400) / d.max"
            :x2="50 + ((i - 1) * 400) / d.max"
            y1="140"
            y2="160"
            stroke="#6c664c"
          />
          <text :x="50 + ((i - 1) * 400) / d.max" y="191" text-anchor="middle">{{ i - 1 }}</text>
        </g>
        <line
          :x1="50 + (d.start * 400) / d.max"
          :x2="50 + (d.end * 400) / d.max"
          y1="119"
          y2="119"
          stroke="#447ba0"
          stroke-width="8"
        />
      </template>
    </svg>
    <p>{{ caption }}</p>
  </div>
</template>
<style scoped>
.math-practice-figure {
  width: 100%;
  min-width: 0;
}
.math-practice-figure svg {
  width: 100%;
  max-width: 580px;
  height: auto;
  display: block;
  margin: auto;
  font: 18px system-ui;
  fill: #354f3d;
}
.math-practice-figure p {
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  margin: 10px 0 0;
  color: #52694f;
}
</style>
