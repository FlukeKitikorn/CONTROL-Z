/**
 * @deprecated ใช้ `node scripts/parse-fr05-table.mjs` แทน — อ่าน fr_05.htm แบบตาราง UTF-8
 * ไฟล์นี้คงไว้เพื่อไม่ให้สคริปต์เก่าหัก — ส่งต่อไปยัง parse-fr05-table.mjs
 */
import { spawnSync } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const next = path.join(__dirname, "parse-fr05-table.mjs")
const r = spawnSync(process.execPath, [next], { stdio: "inherit", shell: false })
process.exit(r.status ?? 1)
