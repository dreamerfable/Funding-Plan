<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAppColorMode } from '../../composables/useAppColorMode'

Chart.register(...registerables)

const props = defineProps<{
  labels: string[]
  datasets: { label: string; data: (number | null)[] }[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { isDark } = useAppColorMode()
let chart: Chart | null = null

const palette = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function render() {
  if (!canvasRef.value) return
  chart?.destroy()
  const text = isDark.value ? '#e4e4e7' : '#3f3f46'
  const grid = isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  chart = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: props.datasets.map((d, i) => {
        const color = palette[i % palette.length]
        return {
          label: d.label,
          data: d.data,
          borderColor: color,
          backgroundColor: color + '33',
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointBorderWidth: 0,
          tension: 0.4,
          cubicInterpolationMode: 'monotone',
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 5
        }
      })
    },
    options: {
      elements: {
        line: {
          tension: 0.4,
          cubicInterpolationMode: 'monotone'
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: text } } },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid } },
        y: {
          ticks: { color: text, callback: v => `${v}%` },
          grid: { color: grid },
          title: { display: true, text: 'Drift (pp)', color: text }
        }
      }
    }
  })
}

onMounted(render)
watch(() => [props.labels, props.datasets, isDark.value], render, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div class="h-72 sm:h-96 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
