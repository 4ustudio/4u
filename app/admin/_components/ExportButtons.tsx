'use client'

import { MdPictureAsPdf, MdTableChart } from 'react-icons/md'

type Cell = string | number | null | undefined

interface Props {
  title: string
  filename: string
  headers: string[]
  rows: Cell[][]
}

const esc = (v: Cell) =>
  String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export default function ExportButtons({ title, filename, headers, rows }: Props) {
  const stamp = new Date().toISOString().slice(0, 10)

  // CSV con BOM y ';' (el Excel en español lo abre en columnas directo)
  function toExcel() {
    const q = (v: Cell) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = '﻿' + [headers, ...rows].map(r => r.map(q).join(';')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `${filename}-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function toPdf() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font:11px system-ui,sans-serif;color:#111;margin:24px}
h1{font-size:18px;margin:0}p{color:#666;margin:2px 0 14px}
table{border-collapse:collapse;width:100%}
th{background:#ff7a00;color:#fff;text-align:left}
th,td{border:1px solid #ddd;padding:5px 7px;vertical-align:top}
tr:nth-child(even) td{background:#fafafa}
@page{size:landscape;margin:12mm}
</style></head><body>
<h1>${esc(title)}</h1><p>4U Studio Academy · ${stamp} · ${rows.length} registros</p>
<table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  const cls =
    'inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 disabled:opacity-40'
  const empty = rows.length === 0

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button type="button" onClick={toExcel} disabled={empty} className={cls}>
        <MdTableChart className="h-4 w-4" aria-hidden="true" />
        Excel
      </button>
      <button type="button" onClick={toPdf} disabled={empty} className={cls}>
        <MdPictureAsPdf className="h-4 w-4" aria-hidden="true" />
        PDF
      </button>
    </div>
  )
}
