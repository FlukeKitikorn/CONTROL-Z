// REFACTOR(CANDIDATE-REMOVAL): dev-only script ไม่ถูกเรียกจาก npm — Phase A dead-code audit
/**
 * @deprecated ใช้ `node scripts/parse-fr04-table.mjs` — อ่าน `fr_04.htm` แบบตาราง UTF-8
 */
import { spawnSync } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const next = path.join(__dirname, "parse-fr04-table.mjs")
const r = spawnSync(process.execPath, [next], { stdio: "inherit", shell: false })
process.exit(r.status ?? 1)
