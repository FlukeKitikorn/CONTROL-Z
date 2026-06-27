/**
 * อ่าน `fr_04.htm` (ตาราง HTML เรียบ UTF-8) → `fr04ReportBundle.json`
 * รัน: node scripts/parse-fr04-table.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const srcHtml = path.join(root, "fr_04.htm")
const outJson = path.join(root, "src", "pages", "reports", "fr04", "fr04ReportBundle.json")

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

function padRows(rows, width) {
  return rows.map((r) => {
    const out = r.slice()
    while (out.length < width) out.push("")
    return out
  })
}

function main() {
  if (!fs.existsSync(srcHtml)) {
    console.error("Missing:", srcHtml)
    process.exit(1)
  }
  const html = fs.readFileSync(srcHtml, "utf8")
  const raw = parseSimpleTable(html)
  if (raw.length === 0) {
    console.error("No rows parsed from", srcHtml)
    process.exit(1)
  }

  const footerIdx = raw.findIndex((r) => (r[0] || "").trim() === "จัดทำโดย")
  if (footerIdx < 0) {
    console.error("Expected footer row starting with จัดทำโดย")
    process.exit(1)
  }

  const footerRow = raw[footerIdx]
  const bodyRows = raw.slice(0, footerIdx)
  const width = Math.max(...bodyRows.map((r) => r.length), ...raw.map((r) => r.length))

  const rows = padRows(bodyRows, width)

  const bundle = {
    version: 1,
    source: "fr_04.htm",
    columnCount: width,
    headerRowCount: 4,
    rows,
    footer: {
      preparedByLabel: (footerRow[0] || "").trim() || "จัดทำโดย",
      preparedBy: (footerRow[1] || "").trim(),
      completedLabel: (footerRow[6] || "").trim() || "",
      completedDate: (footerRow[7] || "").trim() || "",
    },
  }

  fs.mkdirSync(path.dirname(outJson), { recursive: true })
  fs.writeFileSync(outJson, JSON.stringify(bundle, null, 2), "utf8")
  console.log("Wrote", outJson, "rows:", rows.length, "cols:", width)
}

main()
