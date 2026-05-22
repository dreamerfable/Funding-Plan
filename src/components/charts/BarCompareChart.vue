<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useColorMode } from '@vueuse/core'

Chart.register(...registerables)

const props = defineProps<{
  labels: string[]
  target: number[]
  actual: number[]
  targetLabel?: string
  actualLabel?: string
  title?: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const colorMode = useColorMode()
let chart: Chart | null = null

const isDark = computed(() => colorMode.value === 'dark')

const TICK_FONT_SIZE = 11

function wrapXLabel(label: string, maxWidthPx: number): string {
  if (!label || maxWidthPx < 24) return label
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return label
  ctx.font = `${TICK_FONT_SIZE}px system-ui, sans-serif`
  if (ctx.measureText(label).width <= maxWidthPx) return label
  const lines: string[] = []
  let line = ''
  for (const ch of label) {
    const next = line + ch
    if (ctx.measureText(next).width > maxWidthPx && line) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.join('\n')
}

function wrappedXLabels(canvas: HTMLCanvasElement, labels: string[]): string[] {
  const width = canvas.parentElement?.clientWidth ?? canvas.clientWidth ?? 400
  const count = Math.max(labels.length, 1)
  const slotWidth = Math.max(36, (width * 0.82) / count - 8)
  return labels.map(l => wrapXLabel(l, slotWidth))
}

function render() {
  if (!canvasRef.value) return
  chart?.destroy()
  const text = isDark.value ? '#e4e4e7' : '#3f3f46'
  const grid = isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const displayLabels = wrappedXLabels(canvasRef.value, props.labels)
  const maxLines = displayLabels.reduce((m, l) => Math.max(m, l.split('\n').length), 1)
  const bottomPad = 4 + (maxLines - 1) * 14
  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [
        {
          label: props.targetLabel ?? 'Target',
          data: props.target,
          backgroundColor: 'rgba(16, 185, 129, 0.65)',
          borderRadius: 6
        },
        {
          label: props.actualLabel ?? 'Actual',
          data: props.actual,
          backgroundColor: 'rgba(59, 130, 246, 0.65)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      datasets: {
        bar: {
          categoryPercentage: 0.55,
          barPercentage: 0.82,
          maxBarThickness: 28
        }
      },
      layout: { padding: { bottom: bottomPad } },
      plugins: {
        legend: { labels: { color: text } },
        title: props.title ? { display: true, text: props.title, color: text } : undefined
      },
      scales: {
        x: {
          ticks: {
            color: text,
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            font: { size: TICK_FONT_SIZE, lineHeight: 1.25 }
          },
          grid: { color: grid }
        },
        y: { ticks: { color: text }, grid: { color: grid } }
      }
    }
  })
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  render()
  const el = canvasRef.value?.parentElement
  if (el) {
    resizeObserver = new ResizeObserver(() => render())
    resizeObserver.observe(el)
  }
})

watch(() => [props.labels, props.target, props.actual, isDark.value], render, { deep: true })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.destroy()
})
</script>

<template>
  <div class="h-64 sm:h-80 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
