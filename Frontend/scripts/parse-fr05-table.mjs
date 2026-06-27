// REFACTOR(CANDIDATE-REMOVAL): dev-only script ไม่ถูกเรียกจาก npm — Phase A dead-code audit
/**
 * อ่าน `fr_05.htm` (ตาราง HTML เรียบ UTF-8) → `fr05ReportBundle.json`
 * รัน: node scripts/parse-fr05-table.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const srcHtml = path.join(root, "fr_05.htm")
const outJson = path.join(root, "src", "pages", "reports", "fr05", "fr05ReportBundle.json")

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function stripTags(inner) {
  return decodeEntities(inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

function parseSimpleTable(html) {
  const rows = []
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let m
  while ((m = trRe.exec(html))) {
    const tr = m[1]
    const cells = []
    const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
    let tm
    while ((tm = tdRe.exec(tr))) {
      cells.push(stripTags(tm[1]))
    }
    rows.push(cells)
  }
  return rows
}

function main() {
  if (!fs.existsSync(srcHtml)) {
    console.error("Missing:", srcHtml)
    process.exit(1)
  }
  const html = fs.readFileSync(srcHtml, "utf8")
  const rows = parseSimpleTable(html)
  if (rows.length === 0) {
    console.error("No rows parsed from", srcHtml)
    process.exit(1)
  }

  const baseIdx = rows.findIndex((r) => (r[0] || "").trim() === "ปีฐาน")
  const footerIdx = rows.findIndex((r) => (r[0] || "").trim() === "จัดทำโดย")
  if (baseIdx < 0 || footerIdx < 0) {
    console.error("Expected markers ปีฐาน / จัดทำโดย — got baseIdx", baseIdx, "footerIdx", footerIdx)
    process.exit(1)
  }

  const currentRows = rows.slice(0, baseIdx)
  const baseRows = rows.slice(baseIdx, footerIdx)
  const footerRow = rows[footerIdx] || []

  const bundle = {
    version: 1,
    source: "fr_05.htm",
    current: { rows: currentRows },
    base: { rows: baseRows },
    footer: {
      preparedByLabel: (footerRow[0] || "").trim(),
      preparedBy: (footerRow[1] || "").trim(),
      completedLabel: (footerRow[6] || "").trim(),
      completedDate: (footerRow[7] || "").trim(),
    },
  }

  fs.mkdirSync(path.dirname(outJson), { recursive: true })
  fs.writeFileSync(outJson, JSON.stringify(bundle, null, 2), "utf8")
  console.log("Wrote", outJson, "rows current:", currentRows.length, "base:", baseRows.length)
}

main()
