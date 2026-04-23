import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Grid,
  Input,
  InputNumber,
  Progress,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
  message,
  Alert,
} from "antd"
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
} from "@ant-design/icons"
import { PageHeader } from "@/components/common/PageHeader"
import { saveMockCalculationResults } from "@/lib/calculationResultsStorage"
import {
  appendBaseYearSnapshotFromFormValues,
  getLatestBaseYearSnapshot,
  getOrganizationStorageId,
} from "@/lib/organizationBaseYearStorage"
import { useAuthStore } from "@/store/useAuthStore"
import dayjs from "dayjs"

const MAIN_STEP_LABELS = [
  "ข้อมูลทั่วไป",
  "ขอบเขตที่ 1",
  "ขอบเขตที่ 2",
  "ขอบเขตที่ 3",
] as const

const SCOPE3_SUB_LABELS = ["แบบประเมินตนเอง", "กรอกข้อมูลขอบเขตที่ 3"] as const

/**
 * Mock: หมวดกิจกรรม Scope 3 สำหรับแบบประเมินเบื้องต้น (ต่อไปดึงจาก database)
 * แต่ละหมวด = หนึ่ง “หน้า” ใน wizard เพื่อไม่ให้ฟอร์มยาวเกินไป
 */
const SCOPE3_ASSESSMENT_CATEGORIES = [
  {
    id: "s3-purchased-goods",
    title: "สินค้าและบริการที่จัดซื้อ",
    description: "การปล่อยก๊าซเชิงอ้อมจากการจัดซื้อสินค้าและบริการที่ใช้ในองค์กร",
  },
  {
    id: "s3-capital-goods",
    title: "สินค้าทุน",
    description: "สินทรัพย์ถาวร อุปกรณ์ และการลงทุนที่เกี่ยวข้องกับห่วงโซ่คุณค่า",
  },
  {
    id: "s3-fuel-energy-related",
    title: "กิจกรรมเชื้อเพลิงและพลังงานที่เกี่ยวข้อง (ไม่นับใน Scope 1–2)",
    description: "เชื้อเพลิงและพลังงานอื่น ๆ ที่อยู่นอกขอบเขต 1 และ 2 แต่เกี่ยวกับห่วงโซ่",
  },
  {
    id: "s3-upstream-transport",
    title: "การขนส่งและกระจายสินค้า (ขาเข้า)",
    description: "การขนส่งวัตถุดิบและสินค้าจากซัพพลายเออร์เข้าสู่องค์กร",
  },
  {
    id: "s3-waste-operations",
    title: "ของเสียที่เกิดจากการดำเนินงาน",
    description: "การจัดการ กำจัด และรีไซเคิลของเสียจากกระบวนการผลิตหรือบริการ",
  },
  {
    id: "s3-business-travel",
    title: "การเดินทางเพื่อธุรกิจของพนักงาน",
    description: "การเดินทางที่ไม่รวมใน Scope 1 (เช่น เที่ยวบิน รถไฟ โรงแรม)",
  },
] as const

const SCOPE3_INFLUENCE_OPTIONS = [
  { value: 1, label: "1 — น้อยที่สุด", hint: "มีอิทธิพลจำกัดในการลดการปล่อย" },
  { value: 3, label: "3 — ปานกลาง", hint: "ควบคุมได้บางส่วน" },
  { value: 5, label: "5 — มากที่สุด", hint: "มีศักยภาพสูงในการสั่งการลดการปล่อย" },
] as const

const SCOPE3_OPPORTUNITY_OPTIONS = [
  { value: 1, label: "1 — น้อยที่สุด", hint: "ความเสี่ยงต่อชื่อเสียงหรือโอกาสทางธุรกิจต่ำ" },
  { value: 3, label: "3 — ปานกลาง", hint: "มีทั้งมุมเสี่ยงและโอกาสในระดับกลาง" },
  { value: 5, label: "5 — มากที่สุด", hint: "ความเสี่ยงต่อชื่อเสียงหรือโอกาสเชิงธุรกิจสูง" },
] as const

const SCOPE3_MAGNITUDE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: String(n),
  hint: n === 1 ? "น้อยที่สุดเมื่อเทียบภาพรวม" : n === 5 ? "มากที่สุดเมื่อเทียบภาพรวม" : undefined,
}))

/** หน่วยผลผลิต — ค่า value ส่งตรงกับ backend (เช่น actionRegister3.php) */
const PRODUCT_UNIT_OPTIONS = [
  { label: "ลิตร", value: "L" },
  { label: "กิโลกรัม", value: "kg" },
  { label: "ตัน", value: "t" },
  { label: "kWh", value: "kWh" },
  { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
  { label: "ชิ้น / หน่วย", value: "pc" },
  { label: "เมกะวัตต์-ชั่วโมง", value: "MWh" },
  { label: "อื่น ๆ (ระบุในหมายเหตุ)", value: "other" },
] as const

const DECIMAL_NUMBER_RULES = [
  { required: true, message: "กรุณากรอกตัวเลข" },
  {
    pattern: /^\d+(\.\d+)?$/,
    message: "กรอกได้เฉพาะตัวเลขและจุดทศนิยม (เช่น 1200 หรือ 1200.5)",
  },
] as const

/** หมวด Scope 1 — กำหนด 2 ทางเลือก (ดึงจากฐานข้อมูล — ตัวอย่างคงที่) */
const SCOPE1_MAIN_CATEGORIES = [
  {
    value: "electricity_energy",
    label: "การใช้พลังงานไฟฟ้า",
    hint: "เชื้อเพลิงหรือแหล่งพลังงานที่เกี่ยวกับการผลิต/ใช้ไฟฟ้าในพื้นที่ควบคุมขององค์กร เช่น เครื่องกำเนิดไฟ หม้อไอน้ำที่ผูกกับระบบพลังงานไฟฟ้า",
  },
  {
    value: "refrigerant_use",
    label: "การใช้สารทำความเย็น",
    hint: "ระบบปรับอากาศ ห้องเย็น หรืออุปกรณ์ที่ใช้สารทำความเย็น (การรั่วไหล / การเติมสาร)",
  },
] as const

type Scope1CategoryValue = (typeof SCOPE1_MAIN_CATEGORIES)[number]["value"]

type Scope1FuelDef = {
  value: string
  label: string
  /** คำอธิบาย MxL (Max Load / ภาระงานสูงสุด) ที่เกี่ยวข้องกับเชื้อเพลิงนี้ */
  mxlHint?: string
  defaultUnits: { label: string; value: string }[]
}

const SCOPE1_FUELS_BY_CATEGORY: Record<Scope1CategoryValue, Scope1FuelDef[]> = {
  electricity_energy: [
    {
      value: "diesel_genset",
      label: "น้ำมันดีเซล (เครื่องกำเนิดไฟ / เครื่องจักรที่เกี่ยวข้องการใช้ไฟฟ้า)",
      mxlHint: "ภาระงานสูงสุดของเครื่องกำเนิดไฟหรือเครื่องจักร (MxL) เช่น kW แรงม้า — ระบุในช่อง MxL หากมีข้อมูล",
      defaultUnits: [
        { label: "ลิตร", value: "L" },
        { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
      ],
    },
    {
      value: "gasoline_genset",
      label: "เบนซิน (เครื่องปั่นไฟ / เครื่องยนต์เล็ก)",
      mxlHint: "MxL เครื่องยนต์ / เครื่องปั่นไฟ (ถ้ามี)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "natural_gas_chp",
      label: "ก๊าซธรรมชาติ / NGV (CHP / หม้อไอน้ำ / โรงไฟในที่)",
      defaultUnits: [
        { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
        { label: "กิโลกรัม", value: "kg" },
      ],
    },
    {
      value: "lpg_power",
      label: "ก๊าซ LPG (เครื่องกำเนิดไฟ / ระบบความร้อน–ไฟฟ้า)",
      defaultUnits: [
        { label: "กิโลกรัม", value: "kg" },
        { label: "ลิตร", value: "L" },
      ],
    },
    {
      value: "fuel_oil",
      label: "น้ำมันเตา / เชื้อเพลิงเหลวอื่น (ระบบผลิตไฟฟ้า–ความร้อน)",
      defaultUnits: [
        { label: "ลิตร", value: "L" },
        { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
      ],
    },
    {
      value: "coal_power",
      label: "ถ่านหิน / เชื้อเพลิงแข็ง (โรงไฟในที่)",
      defaultUnits: [
        { label: "กิโลกรัม", value: "kg" },
        { label: "ตัน", value: "t" },
      ],
    },
  ],
  refrigerant_use: [
    {
      value: "r410a",
      label: "สารทำความเย็น R-410A",
      mxlHint: "ความจุสูงสุดของระบบ (MxL) หรือปริมาณสารคงคลัง — ใช้ประกอบการคำนวณรั่วไหล",
      defaultUnits: [{ label: "กิโลกรัม", value: "kg" }],
    },
    {
      value: "r32",
      label: "สารทำความเย็น R-32",
      mxlHint: "MxL ความจุระบบ / ปริมาณเติมรายปี (ถ้ามี)",
      defaultUnits: [{ label: "กิโลกรัม", value: "kg" }],
    },
    {
      value: "r134a",
      label: "สารทำความเย็น R-134a",
      defaultUnits: [{ label: "กิโลกรัม", value: "kg" }],
    },
  ],
}

/** บรรทัดรายการจาก getData (mock) — Scope 1 ขั้น 3 */
type Scope1LineFromApi = {
  id: string
  label: string
  unitOptions: { label: string; value: string }[]
}

type Scope1DataQueryResult = {
  lines: Scope1LineFromApi[]
  mxlHint?: string
}

/**
 * จำลอง getData (เช่น #data1) — คืนรายการ ชื่อรายการ + หน่วยต่อแถว และคำแนะนำ MxL (ถ้ามี)
 */
async function getScope1DataPayload(category: Scope1CategoryValue, fuelType: string): Promise<Scope1DataQueryResult> {
  await new Promise((r) => setTimeout(r, 220))
  const list = SCOPE1_FUELS_BY_CATEGORY[category] ?? []
  const fuel = list.find((f) => f.value === fuelType)
  if (!fuel) {
    return { lines: [], mxlHint: undefined }
  }
  const unitOptions = fuel.defaultUnits.map((u) => ({ ...u }))
  const lines: Scope1LineFromApi[] = [
    {
      id: `s1-${fuelType}-mock-1`,
      label: `${fuel.label} — แหล่งใช้ / บันทึกหลัก (mock getData)`,
      unitOptions,
    },
    {
      id: `s1-${fuelType}-mock-2`,
      label: `${fuel.label} — แยกมิเตอร์หรือช่วงเวลา (mock)`,
      unitOptions,
    },
  ]
  if (category === "electricity_energy") {
    lines.push({
      id: `s1-${fuelType}-mock-3`,
      label: `${fuel.label} — สำรอง / รอบบัญชีท้ายปี (mock)`,
      unitOptions,
    })
  }
  return { lines, mxlHint: fuel.mxlHint }
}

/** Scope 2 — พลังงานที่ซื้อจากภายนอก (เลือกได้อย่างใดอย่างหนึ่ง) */
const SCOPE2_ENERGY_TYPES = [
  {
    value: "purchased_electricity",
    label: "ไฟฟ้า",
    hint: "การซื้อไฟฟ้าจากการไฟฟ้า (MEA / PEA) หรือผู้ผลิตเอกชน",
  },
  {
    value: "purchased_steam",
    label: "ไอน้ำ (Steam)",
    hint: "การซื้อไอน้ำร้อนจากโรงไฟฟ้าหรือโรงงานข้างเคียง",
  },
  {
    value: "purchased_other_energy",
    label: "พลังงานอื่น ๆ",
    hint: "เช่น การซื้อความร้อน (Heat) หรือความเย็น (Cooling) มาใช้ในอาคาร / โรงงาน",
  },
] as const

type Scope2EnergyTypeValue = (typeof SCOPE2_ENERGY_TYPES)[number]["value"]

/** บรรทัดรายการจาก query (mock) — แต่ละแถวมีชื่อรายการ + ตัวเลือกหน่วย */
type Scope2LineFromApi = {
  id: string
  label: string
  unitOptions: { label: string; value: string }[]
}

type Scope2DataQueryResult = {
  usageHint?: string
  lines: Scope2LineFromApi[]
}

const SCOPE2_KWH_UNIT_OPTIONS = [
  { label: "kWh (กิโลวัตต์-ชั่วโมง)", value: "kWh" },
  { label: "Unit (หน่วยตามบิลการไฟฟ้า)", value: "unit" },
] as const

const SCOPE2_STEAM_UNIT_OPTIONS = [
  { label: "MJ (เมกะจูล)", value: "MJ" },
  { label: "ตัน (ไอน้ำ / สื่อความร้อน)", value: "ton" },
] as const

const SCOPE2_OTHER_UNIT_OPTIONS = [
  { label: "MJ (เมกะจูล)", value: "MJ" },
  { label: "kWh", value: "kWh" },
  { label: "ตัน", value: "t" },
  { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
] as const

/**
 * จำลอง getData สำหรับ Scope 2 — คืนรายการ (ชื่อรายการ + หน่วยที่เลือกได้) ต่อ mock API จริง
 */
async function getScope2DataPayload(energyType: Scope2EnergyTypeValue): Promise<Scope2DataQueryResult> {
  await new Promise((r) => setTimeout(r, 180))
  switch (energyType) {
    case "purchased_electricity":
      return {
        usageHint:
          "แต่ละแถวมาจาก mock query — ต่อไปแทนที่ด้วยบิล/มิเตอร์จริงจาก backend กรอกปริมาณและหน่วยให้ตรงแต่ละรายการ",
        lines: [
          {
            id: "s2-el-mock-1",
            label: "ไฟฟ้า — สำนักงานใหญ่ (บิล mock: PEA-2025-001142)",
            unitOptions: [...SCOPE2_KWH_UNIT_OPTIONS],
          },
          {
            id: "s2-el-mock-2",
            label: "ไฟฟ้า — โรงงานสาขา จ.ระยอง (บิล mock: IEAT-RY-88421)",
            unitOptions: [...SCOPE2_KWH_UNIT_OPTIONS],
          },
          {
            id: "s2-el-mock-3",
            label: "ไฟฟ้า — EV สถานีชาร์จภายในโรงงาน (สรุปยอด mock)",
            unitOptions: [...SCOPE2_KWH_UNIT_OPTIONS],
          },
        ],
      }
    case "purchased_steam":
      return {
        usageHint: "รายการซื้อไอน้ำ/ความร้อน mock — กรอกปริมาณและหน่วยตามสัญญาซื้อ",
        lines: [
          {
            id: "s2-st-mock-1",
            label: "ไอน้ำความดันสูง — สัญญา IPP นิคมอุตสาหกรรม (mock contract ST-2025-A)",
            unitOptions: [...SCOPE2_STEAM_UNIT_OPTIONS],
          },
          {
            id: "s2-st-mock-2",
            label: "ไอน้ำอุ่น — โรงงานข้างเคียง (mock: รายเดือน)",
            unitOptions: [...SCOPE2_STEAM_UNIT_OPTIONS],
          },
        ],
      }
    case "purchased_other_energy":
      return {
        usageHint: "",
        lines: [
          {
            id: "s2-ot-mock-1",
            label: "ความร้อน — น้ำร้อนหมุนเวียน (mock: สัญญาซื้อความร้อน Q1–Q4)",
            unitOptions: [...SCOPE2_OTHER_UNIT_OPTIONS],
          },
          {
            id: "s2-ot-mock-2",
            label: "ความเย็น — น้ำแช่เย็น / สื่อถ่ายความเย็น (mock)",
            unitOptions: [...SCOPE2_OTHER_UNIT_OPTIONS],
          },
        ],
      }
  }
}

/** Scope 3 กรอกข้อมูล — ประเภทกิจกรรม (mock จนกว่าจะดึงจากฐานข้อมูล) */
const SCOPE3_ENTRY_ACTIVITY_TYPES = [
  {
    value: "s3_upstream_purchased",
    label: "สินค้าและบริการที่จัดซื้อ (ขาเข้า)",
    hint: "Category 1 — ห่วงโซ่คุณค่าของสินค้าและบริการที่จัดซื้อ",
  },
  {
    value: "s3_business_travel",
    label: "การเดินทางทางธุรกิจของพนักงาน",
    hint: "Category 6 — การเดินทางที่ไม่รวมใน Scope 1",
  },
  {
    value: "s3_waste_operations",
    label: "ของเสียจากการดำเนินงาน",
    hint: "Category 5 — การจัดการและกำจัดของเสีย",
  },
] as const

type Scope3EntryActivityValue = (typeof SCOPE3_ENTRY_ACTIVITY_TYPES)[number]["value"]

/** จำลอง getData สำหรับ Scope 3 กรอกข้อมูล — โครงเดียวกับ Scope 2 (lines + usageHint) */
async function getScope3EntryDataPayload(activity: Scope3EntryActivityValue): Promise<Scope2DataQueryResult> {
  await new Promise((r) => setTimeout(r, 160))
  const kgTon = [
    { label: "กิโลกรัม (kg)", value: "kg" },
    { label: "ตัน (t)", value: "t" },
  ]
  const travelUnits = [
    { label: "กิโลเมตร (km)", value: "km" },
    { label: "ครั้ง (trip)", value: "trip" },
  ]
  const thbKg = [
    { label: "บาท (THB)", value: "thb" },
    { label: "กิโลกรัม (kg)", value: "kg" },
  ]
  switch (activity) {
    case "s3_upstream_purchased":
      return {
        usageHint:
          "แต่ละแถวมาจาก mock query (แทนที่ด้วยข้อมูลจากฐานข้อมูล) — กรอกปริมาณและหน่วยให้ตรงกับใบสั่งซื้อ / ใบกำกับ",
        lines: [
          {
            id: "s3-db-up-1",
            label: "ซัพพลายเออร์ — วัตถุดิบกลุ่ม A (mock: PO-2025-88421)",
            unitOptions: [...thbKg],
          },
          {
            id: "s3-db-up-2",
            label: "บริการขนส่งขาเข้า — สายการผลิต X (mock)",
            unitOptions: [...travelUnits],
          },
        ],
      }
    case "s3_business_travel":
      return {
        usageHint: "",
        lines: [
          {
            id: "s3-db-tr-1",
            label: "เที่ยวบินในประเทศ — รวมรอบปี (mock)",
            unitOptions: [...travelUnits],
          },
          {
            id: "s3-db-tr-2",
            label: "โรงแรม / ที่พัก — คืนคืน (mock)",
            unitOptions: [
              { label: "คืนคืน (nights)", value: "nights" },
              { label: "บาท (THB)", value: "thb" },
            ],
          },
        ],
      }
    case "s3_waste_operations":
      return {
        usageHint: "ของเสีย mock — ปริมาณตามใบกำกับผู้กำจัดหรือบันทึกภายใน (ต่อไปจาก DB)",
        lines: [
          {
            id: "s3-db-wa-1",
            label: "ของเสียอันตราย — ส่งกำจัด (mock: manifest H-2025-03)",
            unitOptions: [...kgTon],
          },
          {
            id: "s3-db-wa-2",
            label: "ของเสียทั่วไป — ฝังกลบ / รีไซเคิล (mock)",
            unitOptions: [...kgTon],
          },
        ],
      }
  }
}

const { useBreakpoint } = Grid
const { RangePicker } = DatePicker

function SectionBlock({
  step,
  title,
  children,
  sectionId,
}: {
  step: string
  title: string
  children: ReactNode
  sectionId?: string
}) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-28 border-t border-slate-200/80 pt-6 first:border-t-0 first:pt-0"
    >
      <div className="pl-5 pr-3 sm:pl-7 sm:pr-4 md:pl-10 md:pr-6">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xs font-bold tabular-nums text-teal-700">{step}</span>
          <Typography.Title level={5} className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base">
            {title}
          </Typography.Title>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}

export function DataInputPage() {
  const screens = useBreakpoint()
  const stepsDirection = screens.md ? "horizontal" : "vertical"
  const authUser = useAuthStore((s) => s.user)
  const authSeedKey = authUser?.email ?? authUser?.username ?? null

  const [mainStep, setMainStep] = useState(0)
  const [scope3SubStep, setScope3SubStep] = useState(0)
  /** หมวดกิจกรรมปัจจุบันในแบบประเมิน Scope 3 (wizard) */
  const [scope3AssessmentCategoryIndex, setScope3AssessmentCategoryIndex] = useState(0)
  const [loadingCalc, setLoadingCalc] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm()

  const dateStart = Form.useWatch("date_start", form)
  const dateEnd = Form.useWatch("date_end", form)
  const datStart = Form.useWatch("dat_start", form)
  const datEnd = Form.useWatch("dat_end", form)

  const scope1Category = Form.useWatch("scope1_category", form) as Scope1CategoryValue | undefined
  const scope1FuelType = Form.useWatch("scope1_fuel_type", form) as string | undefined
  const scope2EnergyType = Form.useWatch("scope2_energy_type", form) as Scope2EnergyTypeValue | undefined
  const scope3EntryActivityType = Form.useWatch("scope3_entry_activity_type", form) as Scope3EntryActivityValue | undefined

  const [scope1Data1Loading, setScope1Data1Loading] = useState(false)
  const [scope1Data1Meta, setScope1Data1Meta] = useState<Scope1DataQueryResult>({ lines: [] })

  const [scope2DataLoading, setScope2DataLoading] = useState(false)
  const [scope2DataMeta, setScope2DataMeta] = useState<Scope2DataQueryResult>({ lines: [] })

  const [scope3EntryDataLoading, setScope3EntryDataLoading] = useState(false)
  const [scope3EntryDataMeta, setScope3EntryDataMeta] = useState<Scope2DataQueryResult>({ lines: [] })

  const scope1FuelOptions = useMemo(() => {
    if (!scope1Category) return []
    return SCOPE1_FUELS_BY_CATEGORY[scope1Category] ?? []
  }, [scope1Category])

  const s3AssessmentNav = useMemo(() => {
    const n = SCOPE3_ASSESSMENT_CATEGORIES.length
    const idx = Math.min(Math.max(0, scope3AssessmentCategoryIndex), n - 1)
    const category = SCOPE3_ASSESSMENT_CATEGORIES[idx]
    return {
      idx,
      n,
      category,
      progress: Math.round(((idx + 1) / n) * 100),
    }
  }, [scope3AssessmentCategoryIndex])

  const [docNameSeededFor, setDocNameSeededFor] = useState<string | null>(null)
  const [baseYearFieldsSeededFor, setBaseYearFieldsSeededFor] = useState<string | null>(null)

  useEffect(() => {
    if (!authSeedKey || !authUser) return
    if (docNameSeededFor === authSeedKey) return
    form.setFieldsValue({
      fname: authUser.fname ?? "",
      lname: authUser.lname ?? "",
    })
    setDocNameSeededFor(authSeedKey)
  }, [authSeedKey, authUser, docNameSeededFor, form])

  useEffect(() => {
    if (mainStep !== 0 || !authUser) return
    const orgId = getOrganizationStorageId(authUser)
    const seedKey = `${orgId}:${authSeedKey ?? ""}`
    if (baseYearFieldsSeededFor === seedKey) return
    const latest = getLatestBaseYearSnapshot(orgId)
    if (!latest) {
      setBaseYearFieldsSeededFor(seedKey)
      return
    }
    const existingStart = form.getFieldValue("dat_start")
    if (existingStart != null) {
      setBaseYearFieldsSeededFor(seedKey)
      return
    }
    form.setFieldsValue({
      dat_start: dayjs(latest.dat_start),
      dat_end: dayjs(latest.dat_end),
      ...(latest.vx_create != null ? { vx_create: latest.vx_create } : {}),
      ...(latest.unity != null ? { unity: latest.unity } : {}),
    })
    setBaseYearFieldsSeededFor(seedKey)
  }, [mainStep, authUser, authSeedKey, baseYearFieldsSeededFor, form])

  useEffect(() => {
    if (mainStep !== 1) {
      setScope1Data1Meta({ lines: [] })
      setScope1Data1Loading(false)
      return
    }
    if (!scope1Category || !scope1FuelType) {
      setScope1Data1Meta({ lines: [] })
      setScope1Data1Loading(false)
      return
    }
    let cancelled = false
    setScope1Data1Loading(true)
    getScope1DataPayload(scope1Category, scope1FuelType)
      .then((res) => {
        if (cancelled) return
        setScope1Data1Meta(res)
        setScope1Data1Loading(false)
        form.setFieldsValue({
          scope1_lines: res.lines.map((l) => ({
            lineId: l.id,
            quantity: undefined as number | undefined,
            unit: l.unitOptions.length === 1 ? l.unitOptions[0].value : undefined,
          })),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setScope1Data1Loading(false)
          setScope1Data1Meta({ lines: [] })
        }
      })
    return () => {
      cancelled = true
    }
  }, [mainStep, scope1Category, scope1FuelType, form])

  useEffect(() => {
    if (mainStep !== 2) {
      setScope2DataMeta({ lines: [] })
      setScope2DataLoading(false)
      return
    }
    if (!scope2EnergyType) {
      setScope2DataMeta({ lines: [] })
      setScope2DataLoading(false)
      return
    }
    let cancelled = false
    setScope2DataLoading(true)
    getScope2DataPayload(scope2EnergyType)
      .then((res) => {
        if (cancelled) return
        setScope2DataMeta(res)
        setScope2DataLoading(false)
        form.setFieldsValue({
          scope2_lines: res.lines.map((l) => ({
            lineId: l.id,
            quantity: undefined as number | undefined,
            unit: l.unitOptions.length === 1 ? l.unitOptions[0].value : undefined,
          })),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setScope2DataLoading(false)
          setScope2DataMeta({ lines: [] })
        }
      })
    return () => {
      cancelled = true
    }
  }, [mainStep, scope2EnergyType, form])

  useEffect(() => {
    if (mainStep === 3 && scope3SubStep === 0) {
      setScope3AssessmentCategoryIndex(0)
    }
  }, [mainStep, scope3SubStep])

  useEffect(() => {
    if (mainStep !== 3 || scope3SubStep !== 0) return
    const rows = form.getFieldValue("s3_self_assessments") as unknown
    const ok = Array.isArray(rows) && rows.length === SCOPE3_ASSESSMENT_CATEGORIES.length
    if (ok) return
    form.setFieldsValue({
      s3_self_assessments: SCOPE3_ASSESSMENT_CATEGORIES.map((c) => ({
        categoryId: c.id,
        presence: undefined as "yes" | "no" | undefined,
        magnitude: undefined as number | undefined,
        influenceLevel: undefined as 1 | 3 | 5 | undefined,
        opportunityRisk: undefined as 1 | 3 | 5 | undefined,
        sectorGuidance: undefined as "yes" | "no" | undefined,
        outsourcing: undefined as "yes" | "no" | undefined,
        employeeEngagement: undefined as "yes" | "no" | undefined,
        remark: undefined as string | undefined,
      })),
    })
  }, [mainStep, scope3SubStep, form])

  useEffect(() => {
    if (mainStep !== 3 || scope3SubStep !== 1) {
      setScope3EntryDataMeta({ lines: [] })
      setScope3EntryDataLoading(false)
      return
    }
    if (!scope3EntryActivityType) {
      setScope3EntryDataMeta({ lines: [] })
      setScope3EntryDataLoading(false)
      return
    }
    let cancelled = false
    setScope3EntryDataLoading(true)
    getScope3EntryDataPayload(scope3EntryActivityType)
      .then((res) => {
        if (cancelled) return
        setScope3EntryDataMeta(res)
        setScope3EntryDataLoading(false)
        form.setFieldsValue({
          scope3_entry_lines: res.lines.map((l) => ({
            lineId: l.id,
            quantity: undefined as number | undefined,
            unit: l.unitOptions.length === 1 ? l.unitOptions[0].value : undefined,
          })),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setScope3EntryDataLoading(false)
          setScope3EntryDataMeta({ lines: [] })
        }
      })
    return () => {
      cancelled = true
    }
  }, [mainStep, scope3SubStep, scope3EntryActivityType, form])

  const milestoneIndex = useMemo(() => {
    if (mainStep < 3) return mainStep
    return 3 + scope3SubStep
  }, [mainStep, scope3SubStep])

  const totalMilestones = 5
  const progressPercent = Math.round(((milestoneIndex + 1) / totalMilestones) * 100)

  const isLastMilestone = mainStep === 3 && scope3SubStep === 1

  const mainStepItems = useMemo(
    () => [
      {
        title: MAIN_STEP_LABELS[0],
        description: "ข้อมูลพื้นฐานก่อนกรอกกิจกรรม",
        icon: <HomeOutlined />,
      },
      {
        title: MAIN_STEP_LABELS[1],
        description: "การปล่อยก๊าซเรือนกระจกทางตรงขององค์กร",
        icon: <DatabaseOutlined />,
      },
      {
        title: MAIN_STEP_LABELS[2],
        description: "การปล่อยก๊าซเรือนกระจกทางอ้อมขององค์กร",
        icon: <CloudOutlined />,
      },
      {
        title: MAIN_STEP_LABELS[3],
        description: "การปล่อยก๊าซเรือนกระจกทางอ้อมอื่นๆ",
        icon: <GlobalOutlined />,
      },
    ],
    [],
  )

  const resolveUnityLabel = useCallback((code: string | undefined) => {
    if (!code) return undefined
    return PRODUCT_UNIT_OPTIONS.find((o) => o.value === code)?.label
  }, [])

  const goNext = useCallback(async () => {
    if (mainStep === 0) {
      try {
        await form.validateFields(["fname", "lname", "date_create", "v_create", "unitx", "vx_create", "unity"])
        const s = form.getFieldValue("date_start")
        const e = form.getFieldValue("date_end")
        if (!s || !e) {
          messageApi.error("เลือกช่วงวันที่เก็บข้อมูลให้ครบ")
          return
        }
        const ds = form.getFieldValue("dat_start")
        const dend = form.getFieldValue("dat_end")
        if (!ds || !dend) {
          messageApi.error("เลือกช่วงปีฐานให้ครบ")
          return
        }
        const vals = form.getFieldsValue(true) as Record<string, unknown>
        const orgId = getOrganizationStorageId(authUser)
        appendBaseYearSnapshotFromFormValues(orgId, vals, resolveUnityLabel)
        setMainStep(1)
      } catch {
        /* validateFields แสดงข้อผิดพลาดของฟิลด์ที่มี name แล้ว */
      }
      return
    }
    if (mainStep < 2) {
      setMainStep((s) => s + 1)
      return
    }
    if (mainStep === 2) {
      setMainStep(3)
      setScope3SubStep(0)
      return
    }
    if (mainStep === 3 && scope3SubStep === 0) {
      setScope3SubStep(1)
    }
  }, [mainStep, scope3SubStep, form, authUser, resolveUnityLabel, messageApi])

  const goBack = useCallback(() => {
    if (mainStep === 3 && scope3SubStep === 1) {
      setScope3SubStep(0)
      return
    }
    if (mainStep === 3 && scope3SubStep === 0) {
      setMainStep(2)
      return
    }
    if (mainStep > 0) {
      setMainStep((s) => s - 1)
    }
  }, [mainStep, scope3SubStep])

  const canGoBack = mainStep > 0 || (mainStep === 3 && scope3SubStep > 0)

  const runCalculation = async () => {
    setLoadingCalc(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    saveMockCalculationResults(authUser)
    setLoadingCalc(false)
    messageApi.success("คำนวณเสร็จแล้ว ดูผลได้ที่หน้าผลการคำนวณ")
  }

  const stepContentTitle = useMemo(() => {
    if (mainStep < 3) return MAIN_STEP_LABELS[mainStep]
    return `${MAIN_STEP_LABELS[3]} — ${SCOPE3_SUB_LABELS[scope3SubStep]}`
  }, [mainStep, scope3SubStep])

  const stepContentHint = useMemo(() => {
    switch (mainStep) {
      case 0:
        return "ชื่อผู้จัดทำในเอกสาร วันที่ ช่วงเก็บข้อมูล ช่วงปีฐาน ผลผลิตและหน่วย"
      case 1:
        return "หมวดกิจกรรม → เชื้อเพลิง / แหล่งพลังงาน → ตารางปริมาณรายบรรทัด (#data1)"
      case 2:
        return "การปล่อยก๊าซเรือนกระจกทางอ้อมขององค์กร (Energy Indirect GHG Emissions)"
      case 3:
        return scope3SubStep === 0
          ? "แบบประเมินเบื้องต้นทีละหมวดกิจกรรม"
          : "การปล่อยก๊าซเรือนกระจกทางอ้อมอื่นๆ (Other Indirect GHG Emissions)"
      default:
        return ""
    }
  }, [mainStep, scope3SubStep])

  return (
    <div className="data-input-page w-full min-w-0 space-y-6 pb-28 md:space-y-8 md:pb-12">
      {contextHolder}

      <PageHeader
        title="กรอกข้อมูล"
        description="ทำทีละขั้นตาม : ข้อมูลทั่วไป → ขอบเขต 1–3 โดยขอบเขตที่ 3 แบ่งเป็นแบบประเมินตนเอง แล้วจึงกรอกกิจกรรม"
      />

      <div className="flex flex-col gap-8 md:gap-10">
      <Card
        className="overflow-hidden border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
        styles={{ body: { padding: screens.md ? 24 : 16 } }}
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Typography.Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
              ความคืบหน้ารวม
            </Typography.Text>
            <div className="mt-1 flex items-center gap-2">
              <Typography.Text strong className="text-slate-800">
                ขั้นที่ {milestoneIndex + 1} จาก {totalMilestones}
              </Typography.Text>
              <CheckCircleOutlined className="text-emerald-600" />
            </div>
          </div>
          <Typography.Text type="secondary" className="text-sm">
            {progressPercent}% เสร็จแล้ว
          </Typography.Text>
        </div>
        <Progress
          percent={progressPercent}
          showInfo={false}
          strokeColor={{ "0%": "#0d9488", "100%": "#047857" }}
          trailColor="#e2e8f0"
          className="!mb-8"
        />

        <Steps
          current={mainStep}
          direction={stepsDirection}
          items={mainStepItems}
          size="small"
          className="
            [&_.ant-steps-item-process_.ant-steps-item-title]:!font-bold
            [&_.ant-steps-item-process_.ant-steps-item-description]:!font-semibold
            [&_.ant-steps-item-description]:!max-w-[min(100%,220px)] md:[&_.ant-steps-item-description]:!max-w-[200px] xl:[&_.ant-steps-item-description]:!max-w-none
            [&_.ant-steps-item-description]:!text-xs
          "
        />
      </Card>

      <Card
        className="overflow-hidden border-slate-200/90 shadow-sm ring-1 ring-slate-100/80"
        styles={{ body: { padding: screens.md ? 24 : 16 } }}
      >
        <header className="mb-6 border-b border-slate-200/90 pb-6">
          <Space align="start" size="middle" className="w-full">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-100/90 text-lg text-teal-800">
              <FileTextOutlined />
            </span>
            <div className="min-w-0">
              <Typography.Title level={4} className="!mb-1 !text-base !font-semibold text-slate-900 md:!text-lg">
                {stepContentTitle}
              </Typography.Title>
              <Typography.Paragraph type="secondary" className="!mb-0 !text-sm leading-relaxed">
                {stepContentHint}
              </Typography.Paragraph>
            </div>
          </Space>
        </header>

        {mainStep === 3 ? (
          <div className="mb-6">
            <Segmented
              block
              size="large"
              value={scope3SubStep === 0 ? SCOPE3_SUB_LABELS[0] : SCOPE3_SUB_LABELS[1]}
              options={[
                { label: SCOPE3_SUB_LABELS[0], value: SCOPE3_SUB_LABELS[0] },
                { label: SCOPE3_SUB_LABELS[1], value: SCOPE3_SUB_LABELS[1] },
              ]}
              onChange={(v) => setScope3SubStep(v === SCOPE3_SUB_LABELS[0] ? 0 : 1)}
              className="!bg-slate-100/80 p-1 [&_.ant-segmented-item-selected]:!bg-white [&_.ant-segmented-item-selected]:!text-teal-800 [&_.ant-segmented-item-selected]:!shadow-sm"
            />
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
              <span className="mt-0.5 font-semibold text-teal-700">ลำดับ:</span>
              <span>
                แนะนำให้ทำ <strong>แบบประเมินตนเอง</strong> ก่อน แล้วค่อยไปที่{" "}
                <strong>กรอกข้อมูลขอบเขตที่ 3</strong> เพื่อให้รู้ว่าควรเน้นหมวดใด
              </span>
            </div>
          </div>
        ) : null}

        {mainStep === 3 ? <Divider className="!my-2 !mb-8 border-slate-200/80" /> : null}

        <Form form={form} layout="vertical" requiredMark className="w-full min-w-0">
          {mainStep === 0 && (
            <div className="space-y-0">
              <SectionBlock step="" title="ชื่อผู้จัดทำในเอกสาร">
                <Typography.Paragraph type="secondary" className="!mb-4 !text-xs !leading-relaxed">
                  ค่าเริ่มต้นดึงจากบัญชีผู้ใช้ คุณสามารถเปลี่ยนชื่อที่ปรากฏในเอกสารรายงานได้โดยไม่กระทบข้อมูลในเมนูตั้งค่า
                </Typography.Paragraph>
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="fname" label="ชื่อจริง" rules={[{ required: true, message: "กรอกชื่อ" }]}>
                      <Input placeholder="ชื่อผู้จัดทำในเอกสาร" autoComplete="off" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="lname" label="นามสกุล" rules={[{ required: true, message: "กรอกนามสกุล" }]}>
                      <Input placeholder="นามสกุลในเอกสาร" autoComplete="off" />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionBlock>

              <SectionBlock step="1" title="วันที่จัดทำรายงาน">
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={12} lg={10}>
                    <Form.Item name="date_create" label="วันที่จัดทำ" rules={[{ required: true, message: "เลือกวันที่จัดทำ" }]}>
                      <DatePicker className="!w-full max-w-md" format="YYYY-MM-DD" placeholder="เลือกวันที่" />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionBlock>

              <SectionBlock step="2" title="ระยะเวลาเก็บข้อมูล">
                <Form.Item
                  label="ช่วงวันที่ (เริ่มต้น – สิ้นสุด)"
                  required
                  rules={[
                    {
                      validator: async () => {
                        const s = form.getFieldValue("date_start")
                        const e = form.getFieldValue("date_end")
                        if (!s || !e) {
                          return Promise.reject(new Error("เลือกช่วงวันที่ให้ครบ"))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <RangePicker
                    className="!w-full max-w-xl"
                    format="YYYY-MM-DD"
                    placeholder={["เริ่มต้น", "สิ้นสุด"]}
                    value={dateStart && dateEnd ? [dateStart, dateEnd] : null}
                    onChange={(range) => {
                      form.setFieldsValue({
                        date_start: range?.[0] ?? undefined,
                        date_end: range?.[1] ?? undefined,
                      })
                    }}
                  />
                </Form.Item>
              </SectionBlock>

              <SectionBlock step="3" title="ผลผลิต (ปัจจุบัน) และหน่วย">
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={14}>
                    <Form.Item name="v_create" label="ผลผลิต (ปัจจุบัน)" rules={[...DECIMAL_NUMBER_RULES]}>
                      <Input inputMode="decimal" placeholder="ตัวเลข / ทศนิยม เช่น 1500.25" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={10}>
                    <Form.Item name="unitx" label="หน่วย" rules={[{ required: true, message: "เลือกหน่วย" }]}>
                      <Select placeholder="เลือกหน่วย" options={[...PRODUCT_UNIT_OPTIONS]} allowClear />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionBlock>

              <SectionBlock step="4 – 5" title="ปีฐาน (อ้างอิง) และผลผลิตปีฐาน" sectionId="section-base-year">
                <Form.Item
                  label="ช่วงปีฐาน (เริ่มต้น – สิ้นสุด)"
                  required
                  className="!mb-4"
                  rules={[
                    {
                      validator: async () => {
                        const s = form.getFieldValue("dat_start")
                        const e = form.getFieldValue("dat_end")
                        if (!s || !e) {
                          return Promise.reject(new Error("เลือกช่วงปีฐานให้ครบ"))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <RangePicker
                    className="!w-full max-w-xl"
                    format="YYYY-MM-DD"
                    placeholder={["เริ่มต้น (ปีฐาน)", "สิ้นสุด (ปีฐาน)"]}
                    value={datStart && datEnd ? [datStart, datEnd] : null}
                    onChange={(range) => {
                      form.setFieldsValue({
                        dat_start: range?.[0] ?? undefined,
                        dat_end: range?.[1] ?? undefined,
                      })
                    }}
                  />
                </Form.Item>
                <Row gutter={[20, 0]}>
                  <Col xs={24} md={14}>
                    <Form.Item name="vx_create" label="ผลผลิต (ปีฐาน)" rules={[...DECIMAL_NUMBER_RULES]}>
                      <Input inputMode="decimal" placeholder="ตัวเลข / ทศนิยม" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={10}>
                    <Form.Item name="unity" label="หน่วย (ปีฐาน)" rules={[{ required: true, message: "เลือกหน่วย" }]}>
                      <Select placeholder="เลือกหน่วย" options={[...PRODUCT_UNIT_OPTIONS]} allowClear />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionBlock>
            </div>
          )}

          {mainStep === 1 && (
            <div className="space-y-0">
              <SectionBlock
                step="1"
                title="เลือกหมวดหมู่กิจกรรมที่เกิดขึ้นในองค์กรของคุณ (โปรดเลือก)"
              >
                <Form.Item
                  name="scope1_category"
                  rules={[{ required: true, message: "เลือกหมวดกิจกรรม" }]}
                >
                  <Radio.Group
                    className="flex w-full flex-col gap-5 md:gap-6"
                    onChange={() => {
                      form.setFieldsValue({
                        scope1_fuel_type: undefined,
                        scope1_lines: [],
                        scope1_mxl: undefined,
                        scope1_activity_note: undefined,
                      })
                      setScope1Data1Meta({ lines: [] })
                    }}
                  >
                    {SCOPE1_MAIN_CATEGORIES.map((c) => (
                      <Radio
                        key={c.value}
                        value={c.value}
                        className="items-start !mr-0 !flex !h-auto !min-h-[4.5rem] !max-w-none rounded-xl py-4 pl-5 pr-5 transition-all duration-200 ease-out hover:border-slate-200 md:!min-h-[5rem] md:py-5 md:pl-6 md:pr-6 [&.ant-radio-wrapper-checked]:!border-transparent [&.ant-radio-wrapper-checked]:bg-teal-50/35"
                      >
                        <span className="block max-w-full pt-0.5">
                          <span className="font-medium text-slate-800">{c.label}</span>
                          <span className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-500">{c.hint}</span>
                        </span>
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </SectionBlock>

              <SectionBlock step="2" title="การปล่อย GHG โดยตรงนอกข้อกำหนด">
                {!scope1Category ? (
                  <Typography.Text type="secondary" className="text-sm">
                    เลือกหมวดในข้อ 1 ก่อน ระบบจะแสดงตัวเลือกประเภทเชื้อเพลิง / แหล่งพลังงานที่เกี่ยวข้อง
                  </Typography.Text>
                ) : (
                  <>
                    <div className="mb-4 rounded-lg bg-slate-50/90 px-4 py-2.5 text-sm text-slate-700 sm:px-5">
                      <span className="font-medium text-teal-800">หมวดที่เลือก: </span>
                      {SCOPE1_MAIN_CATEGORIES.find((x) => x.value === scope1Category)?.label ?? scope1Category}
                    </div>
                    <Form.Item
                      name="scope1_fuel_type"
                      label="ประเภทเชื้อเพลิง / แหล่งพลังงาน"
                      rules={[{ required: true, message: "เลือกประเภทเชื้อเพลิง" }]}
                    >
                      <Radio.Group
                        className="box-border flex w-full max-w-full flex-col gap-4 md:gap-5"
                        onChange={() => {
                          form.setFieldsValue({
                            scope1_lines: [],
                            scope1_mxl: undefined,
                          })
                        }}
                      >
                        {scope1FuelOptions.map((f) => (
                          <Radio
                            key={f.value}
                            value={f.value}
                            className="items-start !mr-0 !flex !h-auto !max-w-none rounded-xl py-3.5 pl-5 pr-5 transition-colors hover:border-slate-200 md:py-4 md:pl-6 md:pr-6 [&.ant-radio-wrapper-checked]:!border-transparent [&.ant-radio-wrapper-checked]:bg-teal-50/35"
                          >
                            <span className="block max-w-full pt-0.5">
                              <span className="font-medium text-slate-800">{f.label}</span>
                            </span>
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                  </>
                )}
              </SectionBlock>

              <SectionBlock step="3" title="ข้อมูลปริมาณ">
                <Alert title="(MxL = Max Load)" 
                  type="info" 
                  showIcon 
                />
                <div id="data1" className="scroll-mt-24">
                  <Spin spinning={scope1Data1Loading} tip="กำลังโหลดข้อมูลจาก getData…">
                    {!scope1Category || !scope1FuelType ? (
                      <Typography.Text type="secondary" className="block py-6 text-center text-sm">
                        เลือกหมวดและประเภทเชื้อเพลิงเพื่อโหลดรายการจากระบบ
                      </Typography.Text>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {scope1Data1Meta.mxlHint ? (
                          <Typography.Paragraph type="secondary" className="!mb-0 !text-xs !leading-relaxed">
                            {scope1Data1Meta.mxlHint}
                          </Typography.Paragraph>
                        ) : null}
                        {scope1Data1Meta.mxlHint ? (
                          <Form.Item
                            name="scope1_mxl"
                            label="ภาระงานสูงสุด (MxL) — ถ้ามีข้อมูล"
                            tooltip="ไม่บังคับ — กรอกเมื่อมีข้อมูลจากเครื่องจักร ยานพาหนะ หรือความจุระบบ"
                          >
                            <InputNumber min={0} className="!w-full max-w-xs" placeholder="เช่น กำลัง kW / ความจุ / น้ำหนักบรรทุก" />
                          </Form.Item>
                        ) : null}
                        <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
                          <Row
                            gutter={16}
                            className="border-b border-slate-200/80 bg-slate-50/95 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                          >
                            <Col xs={24} md={11}>
                              ชื่อรายการ
                            </Col>
                            <Col xs={12} md={7}>
                              ปริมาณ
                            </Col>
                            <Col xs={12} md={6}>
                              หน่วย
                            </Col>
                          </Row>
                          <Form.List name="scope1_lines">
                            {(fields) =>
                              fields.length === 0 ? (
                                <Typography.Text type="secondary" className="block px-4 py-8 text-center text-sm">
                                  {scope1Data1Loading ? "กำลังเตรียมรายการ…" : "ไม่มีรายการจากระบบ"}
                                </Typography.Text>
                              ) : (
                                fields.map((field, index) => {
                                  const lineDef = scope1Data1Meta.lines[index]
                                  return (
                                    <Row
                                      key={field.key}
                                      gutter={[16, 12]}
                                      className="border-b border-slate-100/90 px-4 py-4 last:border-b-0"
                                      align="top"
                                    >
                                      <Col xs={24} md={11}>
                                        <Typography.Text className="block text-sm leading-relaxed text-slate-800">
                                          {lineDef?.label ?? "—"}
                                        </Typography.Text>
                                        <Form.Item name={[field.name, "lineId"]} hidden>
                                          <Input />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={12} md={7}>
                                        <Form.Item
                                          name={[field.name, "quantity"]}
                                          rules={[{ required: true, message: "กรอกปริมาณ" }]}
                                          className="!mb-0"
                                        >
                                          <InputNumber min={0} className="!w-full" placeholder="กรอกปริมาณ" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={12} md={6}>
                                        <Form.Item
                                          name={[field.name, "unit"]}
                                          rules={[{ required: true, message: "เลือกหน่วย" }]}
                                          className="!mb-0"
                                        >
                                          <Select
                                            placeholder="หน่วย"
                                            allowClear={lineDef ? lineDef.unitOptions.length > 1 : false}
                                            disabled={!lineDef?.unitOptions.length}
                                            options={lineDef?.unitOptions ?? []}
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  )
                                })
                              )
                            }
                          </Form.List>
                        </div>
                      </div>
                    )}
                  </Spin>
                </div>
              </SectionBlock>
            </div>
          )}

          {mainStep === 2 && (
            <div className="space-y-0">
              <SectionBlock step="1" title="หมวดหมู่กิจกรรมใดบ้างที่เกิดขึ้นในองค์กรของคุณ (โปรดเลือก)">
                
                <Form.Item name="scope2_energy_type" rules={[{ required: true, message: "เลือกประเภทพลังงาน" }]}>
                  <Radio.Group
                    className="flex w-full flex-col gap-5 md:gap-6"
                    onChange={() => {
                      form.setFieldsValue({
                        scope2_lines: [],
                        scope2_extra_note: undefined,
                      })
                      setScope2DataMeta({ lines: [] })
                    }}
                  >
                    {SCOPE2_ENERGY_TYPES.map((c) => (
                      <Radio
                        key={c.value}
                        value={c.value}
                        className="items-start !mr-0 !flex !h-auto !min-h-[4.5rem] !max-w-none rounded-xl py-4 pl-5 pr-5 transition-all duration-200 ease-out hover:border-slate-200 md:!min-h-[5rem] md:py-5 md:pl-6 md:pr-6 [&.ant-radio-wrapper-checked]:!border-transparent [&.ant-radio-wrapper-checked]:bg-teal-50/35"
                      >
                        <span className="block max-w-full pt-0.5">
                          <span className="font-medium text-slate-800">{c.label}</span>
                          <span className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-500">{c.hint}</span>
                        </span>
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </SectionBlock>

              <SectionBlock step="2" title="เชื้อเพลิงใดบ้างที่ใช้ในองค์กร (โปรดเลือก)">
                <div id="data1" className="scroll-mt-24">
                  <Spin spinning={scope2DataLoading} tip="กำลังโหลดข้อมูลจาก getData…">
                    {!scope2EnergyType ? (
                      <Typography.Text type="secondary" className="block py-6 text-center text-sm">
                        เลือกประเภทพลังงานในข้อ 1 เพื่อโหลดรายการจากระบบ
                      </Typography.Text>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {scope2DataMeta.usageHint ? (
                          <Typography.Paragraph type="secondary" className="!mb-0 !text-xs !leading-relaxed">
                            {scope2DataMeta.usageHint}
                          </Typography.Paragraph>
                        ) : null}
                        <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
                          <Row
                            gutter={16}
                            className="border-b border-slate-200/80 bg-slate-50/95 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                          >
                            <Col xs={24} md={11}>
                              ชื่อรายการ
                            </Col>
                            <Col xs={12} md={7}>
                              ปริมาณ
                            </Col>
                            <Col xs={12} md={6}>
                              หน่วย
                            </Col>
                          </Row>
                          <Form.List name="scope2_lines">
                            {(fields) =>
                              fields.length === 0 ? (
                                <Typography.Text type="secondary" className="block px-4 py-8 text-center text-sm">
                                  {scope2DataLoading ? "กำลังเตรียมรายการ…" : "ไม่มีรายการจากระบบ"}
                                </Typography.Text>
                              ) : (
                                fields.map((field, index) => {
                                  const lineDef = scope2DataMeta.lines[index]
                                  return (
                                    <Row
                                      key={field.key}
                                      gutter={[16, 12]}
                                      className="border-b border-slate-100/90 px-4 py-4 last:border-b-0"
                                      align="top"
                                    >
                                      <Col xs={24} md={11}>
                                        <Typography.Text className="block text-sm leading-relaxed text-slate-800">
                                          {lineDef?.label ?? "—"}
                                        </Typography.Text>
                                        <Form.Item name={[field.name, "lineId"]} hidden>
                                          <Input />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={12} md={7}>
                                        <Form.Item
                                          name={[field.name, "quantity"]}
                                          rules={[{ required: true, message: "กรอกปริมาณ" }]}
                                          className="!mb-0"
                                        >
                                          <InputNumber min={0} className="!w-full" placeholder="กรอกปริมาณ" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={12} md={6}>
                                        <Form.Item
                                          name={[field.name, "unit"]}
                                          rules={[{ required: true, message: "เลือกหน่วย" }]}
                                          className="!mb-0"
                                        >
                                          <Select
                                            placeholder="หน่วย"
                                            allowClear={lineDef ? lineDef.unitOptions.length > 1 : false}
                                            disabled={!lineDef?.unitOptions.length}
                                            options={lineDef?.unitOptions ?? []}
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  )
                                })
                              )
                            }
                          </Form.List>
                        </div>
                      
                      </div>
                    )}
                  </Spin>
                </div>
              </SectionBlock>

            </div>
          )}

          {mainStep === 3 && scope3SubStep === 0 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <Typography.Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
                      ความคืบหน้ารายหมวดกิจกรรม
                    </Typography.Text>
                    <Typography.Title level={5} className="!mb-0 !mt-1 !text-base md:!text-lg">
                      หมวดที่ {s3AssessmentNav.idx + 1} จาก {s3AssessmentNav.n}
                      <span className="font-normal text-slate-600"> — {s3AssessmentNav.category.title}</span>
                    </Typography.Title>
                  </div>
                  <div className="w-full min-w-0 max-w-md shrink-0">
                    <Progress
                      percent={s3AssessmentNav.progress}
                      size="small"
                      strokeColor={{ "0%": "#0d9488", "100%": "#047857" }}
                      trailColor="#e2e8f0"
                    />
                  </div>
                </div>
                <Divider className="!my-4 border-slate-200/80" />
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <Button
                    type="default"
                    size="large"
                    icon={<LeftOutlined />}
                    disabled={s3AssessmentNav.idx === 0}
                    onClick={() => setScope3AssessmentCategoryIndex((i) => Math.max(0, i - 1))}
                    className="w-full sm:w-auto"
                  >
                    หมวดก่อนหน้า
                  </Button>
                  <Select
                    size="large"
                    className="!min-h-10 w-full min-w-0 sm:!w-[min(100%,22rem)]"
                    value={s3AssessmentNav.idx}
                    onChange={(v) => setScope3AssessmentCategoryIndex(Number(v))}
                    options={SCOPE3_ASSESSMENT_CATEGORIES.map((c, i) => ({
                      label: `${i + 1}. ${c.title}`,
                      value: i,
                    }))}
                    popupMatchSelectWidth={false}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<RightOutlined />}
                    iconPosition="end"
                    disabled={s3AssessmentNav.idx >= s3AssessmentNav.n - 1}
                    onClick={() =>
                      setScope3AssessmentCategoryIndex((i) => Math.min(SCOPE3_ASSESSMENT_CATEGORIES.length - 1, i + 1))
                    }
                    className="w-full sm:w-auto"
                  >
                    หมวดถัดไป
                  </Button>
                </div>
              </div>

              <Typography.Paragraph type="secondary" className="!mb-0 !text-sm !leading-relaxed">
                {s3AssessmentNav.category.description}
              </Typography.Paragraph>

              <Form.Item name={["s3_self_assessments", s3AssessmentNav.idx, "categoryId"]} hidden>
                <Input />
              </Form.Item>

              <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
                <Card
                  size="small"
                  title={
                    <span className="text-sm font-semibold text-slate-800">
                      1. การมีอยู่ของกิจกรรม <span className="font-normal text-slate-500">(Source of GHG)</span>
                    </span>
                  }
                  className="border-slate-200/90 shadow-none"
                >
                  <Form.Item
                    name={["s3_self_assessments", s3AssessmentNav.idx, "presence"]}
                    label="กิจกรรมนี้เกิดขึ้นในองค์กรของคุณหรือไม่?"
                    rules={[{ required: true, message: "เลือกคำตอบ" }]}
                  >
                    <Radio.Group className="flex flex-wrap gap-4">
                      <Radio value="yes" className="!mr-0">
                        ใช่
                      </Radio>
                      <Radio value="no" className="!mr-0">
                        ไม่ใช่
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </Card>

                <Card
                  size="small"
                  title={
                    <span className="text-sm font-semibold text-slate-800">
                      2. ขนาดของผลกระทบ <span className="font-normal text-slate-500">(Magnitude)</span>
                    </span>
                  }
                  className="border-slate-200/90 shadow-none"
                >
                  <Typography.Paragraph type="secondary" className="!mb-3 !text-xs !leading-relaxed">
                    คุณคาดการณ์ว่าปริมาณการปล่อยก๊าซจากกิจกรรมนี้มีมากน้อยเพียงใดเมื่อเทียบกับภาพรวมขององค์กร?
                  </Typography.Paragraph>
                  <Form.Item
                    name={["s3_self_assessments", s3AssessmentNav.idx, "magnitude"]}
                    rules={[{ required: true, message: "ให้คะแนน 1–5" }]}
                    className="!mb-0"
                  >
                    <Radio.Group className="flex w-full flex-wrap gap-2 md:gap-3">
                      {SCOPE3_MAGNITUDE_OPTIONS.map((opt) => (
                        <Radio key={opt.value} value={opt.value} className="!mr-0 min-w-[2.75rem] justify-center">
                          <span className="font-semibold tabular-nums">{opt.label}</span>
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                  <Typography.Text type="secondary" className="mt-2 block text-xs">
                    1 = น้อยที่สุด … 5 = มากที่สุด
                  </Typography.Text>
                </Card>

                <Card
                  size="small"
                  title={
                    <span className="text-sm font-semibold text-slate-800">
                      3. ระดับอิทธิพลในการจัดการ{" "}
                      <span className="font-normal text-slate-500">(Level of Influence)</span>
                    </span>
                  }
                  className="border-slate-200/90 shadow-none"
                >
                  <Typography.Paragraph type="secondary" className="!mb-3 !text-xs !leading-relaxed">
                    องค์กรของคุณมีศักยภาพหรืออำนาจในการสั่งการเพื่อลดการปล่อยก๊าซในส่วนนี้ได้มากน้อยแค่ไหน?
                  </Typography.Paragraph>
                  <Form.Item
                    name={["s3_self_assessments", s3AssessmentNav.idx, "influenceLevel"]}
                    rules={[{ required: true, message: "เลือกคะแนน" }]}
                    className="!mb-0"
                  >
                    <Radio.Group className="flex w-full flex-col gap-3">
                      {SCOPE3_INFLUENCE_OPTIONS.map((opt) => (
                        <Radio key={opt.value} value={opt.value} className="!mr-0 items-start !whitespace-normal">
                          <div>
                            <div className="font-medium text-slate-800">{opt.label}</div>
                            <div className="text-xs font-normal text-slate-500">{opt.hint}</div>
                          </div>
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Card>

                <Card
                  size="small"
                  title={
                    <span className="text-sm font-semibold text-slate-800">
                      4. โอกาสและความเสี่ยง{" "}
                      <span className="font-normal text-slate-500">(Opportunity / Risk)</span>
                    </span>
                  }
                  className="border-slate-200/90 shadow-none"
                >
                  <Typography.Paragraph type="secondary" className="!mb-3 !text-xs !leading-relaxed">
                    กิจกรรมนี้มีความเสี่ยงต่อชื่อเสียงองค์กร หรือมีโอกาสในการสร้างความได้เปรียบทางธุรกิจหรือไม่?
                  </Typography.Paragraph>
                  <Form.Item
                    name={["s3_self_assessments", s3AssessmentNav.idx, "opportunityRisk"]}
                    rules={[{ required: true, message: "เลือกคะแนน" }]}
                    className="!mb-0"
                  >
                    <Radio.Group className="flex w-full flex-col gap-3">
                      {SCOPE3_OPPORTUNITY_OPTIONS.map((opt) => (
                        <Radio key={`or-${opt.value}`} value={opt.value} className="!mr-0 items-start !whitespace-normal">
                          <div>
                            <div className="font-medium text-slate-800">{opt.label}</div>
                            <div className="text-xs font-normal text-slate-500">{opt.hint}</div>
                          </div>
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Card>

                <Card
                  size="small"
                  title={
                    <span className="text-sm font-semibold text-slate-800">
                      5. เกณฑ์ตัดสินอื่น ๆ <span className="font-normal text-slate-500">(ใช่ / ไม่ใช่)</span>
                    </span>
                  }
                  className="border-slate-200/90 shadow-none"
                >
                  <div className="flex flex-col gap-5">
                    <Form.Item
                      name={["s3_self_assessments", s3AssessmentNav.idx, "sectorGuidance"]}
                      label="Sector Guidance"
                      extra="มีข้อกำหนดเฉพาะในกลุ่มอุตสาหกรรมของคุณที่บังคับให้ต้องรายงานหรือไม่?"
                      rules={[{ required: true, message: "เลือกคำตอบ" }]}
                    >
                      <Radio.Group className="flex flex-wrap gap-4">
                        <Radio value="yes">ใช่</Radio>
                        <Radio value="no">ไม่ใช่</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item
                      name={["s3_self_assessments", s3AssessmentNav.idx, "outsourcing"]}
                      label="Outsourcing"
                      extra="เป็นกิจกรรมที่เกิดจากการจ้างเหมาช่วง (Outsource) ที่สำคัญต่อธุรกิจหรือไม่?"
                      rules={[{ required: true, message: "เลือกคำตอบ" }]}
                    >
                      <Radio.Group className="flex flex-wrap gap-4">
                        <Radio value="yes">ใช่</Radio>
                        <Radio value="no">ไม่ใช่</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item
                      name={["s3_self_assessments", s3AssessmentNav.idx, "employeeEngagement"]}
                      label="Employee Engagement"
                      extra="เป็นกิจกรรมที่เกี่ยวข้องกับการสร้างส่วนร่วมของพนักงานอย่างมีนัยสำคัญหรือไม่?"
                      rules={[{ required: true, message: "เลือกคำตอบ" }]}
                    >
                      <Radio.Group className="flex flex-wrap gap-4">
                        <Radio value="yes">ใช่</Radio>
                        <Radio value="no">ไม่ใช่</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                </Card>

                <Card
                  size="small"
                  title={
                    <span className="text-sm font-semibold text-slate-800">
                      6. หมายเหตุ <span className="font-normal text-slate-500">(Remark)</span>
                    </span>
                  }
                  className="border-slate-200/90 shadow-none"
                >
                  <Form.Item
                    name={["s3_self_assessments", s3AssessmentNav.idx, "remark"]}
                    label="ข้อความเพิ่มเติม"
                    // className="mb-4"
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="อธิบายเหตุผลประกอบการให้คะแนนข้างต้น (ไม่บังคับ)"
                      className="!resize-y"
                      showCount
                      maxLength={2000}
                    />
                  </Form.Item>
                </Card>
              </div>
            </div>
          )}

          {mainStep === 3 && scope3SubStep === 1 && (
            <div className="space-y-0">

              <SectionBlock step="1" title="หมวดหมู่กิจกรรมใดบ้างที่เกิดขึ้นในองค์กรของคุณ (โปรดเลือก)">
                <Form.Item name="scope3_entry_activity_type" rules={[{ required: true, message: "เลือกประเภทกิจกรรม" }]}>
                  <Radio.Group
                    className="flex w-full flex-col gap-5 md:gap-6"
                    onChange={() => {
                      form.setFieldsValue({
                        scope3_entry_lines: [],
                        scope3_entry_note: undefined,
                      })
                      setScope3EntryDataMeta({ lines: [] })
                    }}
                  >
                    {SCOPE3_ENTRY_ACTIVITY_TYPES.map((c) => (
                      <Radio
                        key={c.value}
                        value={c.value}
                        className="items-start !mr-0 !flex !h-auto !min-h-[4.5rem] !max-w-none rounded-xl py-4 pl-5 pr-5 transition-all duration-200 ease-out hover:border-slate-200 md:!min-h-[5rem] md:py-5 md:pl-6 md:pr-6 [&.ant-radio-wrapper-checked]:!border-transparent [&.ant-radio-wrapper-checked]:bg-teal-50/35"
                      >
                        <span className="block max-w-full pt-0.5">
                          <span className="font-medium text-slate-800">{c.label}</span>
                          <span className="mt-1.5 block text-xs font-normal leading-relaxed text-slate-500">{c.hint}</span>
                        </span>
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </SectionBlock>

              <SectionBlock step="2" title="เชื้อเพลิงใดบ้างที่ใช้ในองค์กร (โปรดเลือก)">
                <div id="data1" className="scroll-mt-24">
                  <Spin spinning={scope3EntryDataLoading} tip="กำลังโหลดข้อมูลจาก getData…">
                    {!scope3EntryActivityType ? (
                      <Typography.Text type="secondary" className="block py-6 text-center text-sm">
                        เลือกประเภทกิจกรรมในข้อ 1 เพื่อโหลดรายการจากระบบ
                      </Typography.Text>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {scope3EntryDataMeta.usageHint ? (
                          <Typography.Paragraph type="secondary" className="!mb-0 !text-xs !leading-relaxed">
                            {scope3EntryDataMeta.usageHint}
                          </Typography.Paragraph>
                        ) : null}
                        <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
                          <Row
                            gutter={16}
                            className="border-b border-slate-200/80 bg-slate-50/95 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                          >
                            <Col xs={24} md={11}>
                              ชื่อรายการ
                            </Col>
                            <Col xs={12} md={7}>
                              ปริมาณ
                            </Col>
                            <Col xs={12} md={6}>
                              หน่วย
                            </Col>
                          </Row>
                          <Form.List name="scope3_entry_lines">
                            {(fields) =>
                              fields.length === 0 ? (
                                <Typography.Text type="secondary" className="block px-4 py-8 text-center text-sm">
                                  {scope3EntryDataLoading ? "กำลังเตรียมรายการ…" : "ไม่มีรายการจากระบบ"}
                                </Typography.Text>
                              ) : (
                                fields.map((field, index) => {
                                  const lineDef = scope3EntryDataMeta.lines[index]
                                  return (
                                    <Row
                                      key={field.key}
                                      gutter={[16, 12]}
                                      className="border-b border-slate-100/90 px-4 py-4 last:border-b-0"
                                      align="top"
                                    >
                                      <Col xs={24} md={11}>
                                        <Typography.Text className="block text-sm leading-relaxed text-slate-800">
                                          {lineDef?.label ?? "—"}
                                        </Typography.Text>
                                        <Form.Item name={[field.name, "lineId"]} hidden>
                                          <Input />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={12} md={7}>
                                        <Form.Item
                                          name={[field.name, "quantity"]}
                                          rules={[{ required: true, message: "กรอกปริมาณ" }]}
                                          className="!mb-0"
                                        >
                                          <InputNumber min={0} className="!w-full" placeholder="กรอกปริมาณ" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={12} md={6}>
                                        <Form.Item
                                          name={[field.name, "unit"]}
                                          rules={[{ required: true, message: "เลือกหน่วย" }]}
                                          className="!mb-0"
                                        >
                                          <Select
                                            placeholder="หน่วย"
                                            allowClear={lineDef ? lineDef.unitOptions.length > 1 : false}
                                            disabled={!lineDef?.unitOptions.length}
                                            options={lineDef?.unitOptions ?? []}
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  )
                                })
                              )
                            }
                          </Form.List>
                        </div>
                        
                        
                      </div>
                    )}
                  </Spin>
                </div>
              </SectionBlock>
            </div>
          )}
        </Form>
      </Card>
      </div>

      <section className="mt-2 md:mt-4">
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200/90 bg-white/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md md:static md:z-0 md:rounded-2xl md:border md:border-slate-200/90 md:bg-white md:px-6 md:py-5 md:pb-5 md:shadow-sm md:ring-1 md:ring-slate-100/80 md:backdrop-blur-none">
          <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Space wrap size="middle" className="w-full justify-center sm:w-auto sm:justify-start">
              <Button size="large" disabled={!canGoBack} onClick={goBack}>
                ย้อนกลับ
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => void goNext()}
                disabled={isLastMilestone}
                className="min-w-[120px]"
              >
                ถัดไป
              </Button>
            </Space>
            <Space wrap size="middle" className="w-full justify-center sm:w-auto sm:justify-end">
              <Button
                size="large"
                icon={<SaveOutlined />}
                onClick={() => {
                  const vals = form.getFieldsValue(true) as Record<string, unknown>
                  const orgId = getOrganizationStorageId(authUser)
                  const saved = appendBaseYearSnapshotFromFormValues(orgId, vals, resolveUnityLabel)
                  if (!saved) {
                    messageApi.warning(
                      "ยังไม่มีช่วงปีฐานในระบบ — กรุณากรอก «ช่วงปีฐาน (เริ่มต้น – สิ้นสุด)» ในขั้นข้อมูลทั่วไปก่อน แล้วบันทึกร่างอีกครั้ง",
                    )
                    return
                  }
                  messageApi.success("บันทึกฉบับร่างแล้ว และอัปเดตข้อมูลปีฐานสำหรับองค์กรนี้")
                }}
              >
                บันทึกร่าง
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CalculatorOutlined />}
                loading={loadingCalc}
                onClick={runCalculation}
                disabled={!isLastMilestone}
                className="signature-gradient border-0"
              >
                คำนวณคาร์บอนฟุตพรินต์
              </Button>
            </Space>
          </div>
        </div>
      </section>
    </div>
  )
}

