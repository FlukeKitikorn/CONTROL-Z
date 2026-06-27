import { useCallback, useEffect, useMemo, useState, type Key, type ReactNode } from "react"
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Drawer,
  Typography,
  message,
  Alert,
} from "antd"
import {
  CheckCircleOutlined,
  CloudOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SaveOutlined,
} from "@ant-design/icons"
import { PageHeader } from "@/components/common/PageHeader"
import { CollectionPeriodField } from "@/components/data-input/CollectionPeriodField"
import { ApiError } from "@/lib/api/http"
import { buildAnnualReportingBundle } from "@/lib/annualReportingBundle"
import {
  SCOPE1_NONE,
  SCOPE2_NONE,
  evaluateSaveReadiness,
  validateScope1BeforeNext,
  validateScope2BeforeNext,
} from "@/lib/dataInputValidation"
import { isScope3EntryRowMeaningful } from "@/lib/dataInputScope3Helpers"
import { saveAnnualReportBundle, listEfUiOptions } from "@/lib/api/service"
import type { EfUiOptionRead } from "@/lib/api/types"
import {
  buildScope2ElectricityPayload,
  buildScope2LinesFormState,
  buildScope2RefrigerantPayload,
  refrigerantSelectOptions,
  scope1FuelsFromEfOptions,
  type Scope1FuelDef,
  type Scope2DataQueryResult,
  type Scope2LineFromApi,
} from "@/lib/efUiBridge"
import { getOrganizationStorageId } from "@/lib/organizationBaseYearStorage"
import {
  PERIOD_GRANULARITY_OPTIONS,
  getPreferredGranularity,
  setPreferredGranularity,
  type PeriodGranularity,
} from "@/lib/periodGranularity"
import {
  MATERIAL_TOPIC_THRESHOLD,
  computeMaterialTopicIds,
  evaluateMaterialTopic,
  formatMaterialTotal,
  ghgPercentToScore,
} from "@/lib/scope3MaterialTopic"
import { DECIMAL_NUMBER_RULES, PRODUCT_UNIT_OPTIONS } from "@/lib/productUnitOptions"
import { useAuthStore } from "@/store/useAuthStore"

const MAIN_STEP_LABELS = [
  "ข้อมูลทั่วไป",
  "ขอบเขตที่ 1",
  "ขอบเขตที่ 2",
  "แบบประเมินตนเอง",
  "ขอบเขตที่ 3",
] as const

/**
 * หมวด Scope 3 ตาม GHG Protocol (Corporate Value Chain / Scope 3 Standard) — 15 หมวด
 * แต่ละหมวด = หนึ่ง “หน้า” ในแบบประเมินตนเอง
 */
const SCOPE3_ASSESSMENT_CATEGORIES = [
  {
    id: "s3_cat_1_purchased_goods",
    title: "การจัดซื้อสินค้าและบริการ",
    description: "Purchased goods and services",
  },
  {
    id: "s3_cat_2_capital_goods",
    title: "สินทรัพย์ทุน",
    description: "Capital goods",
  },
  {
    id: "s3_cat_3_fuel_energy_related",
    title: "กิจกรรมที่เกี่ยวข้องกับเชื้อเพลิงและพลังงาน",
    description: "Fuel- and energy-related activities",
  },
  {
    id: "s3_cat_4_upstream_transport",
    title: "การขนส่งและกระจายสินค้าต้นน้ำ",
    description: "Upstream transportation and distribution",
  },
  {
    id: "s3_cat_5_waste_operations",
    title: "ของเสียที่เกิดจากการดำเนินงาน",
    description: "Waste generated in operations",
  },
  {
    id: "s3_cat_6_business_travel",
    title: "การเดินทางเพื่อธุรกิจ",
    description: "Business travel",
  },
  {
    id: "s3_cat_7_employee_commuting",
    title: "การเดินทางของพนักงาน",
    description: "Employee commuting",
  },
  {
    id: "s3_cat_8_upstream_leased",
    title: "สินทรัพย์ที่เช่าใช้ต้นน้ำ",
    description: "Upstream leased assets",
  },
  {
    id: "s3_cat_9_downstream_transport",
    title: "การขนส่งและกระจายสินค้าปลายน้ำ",
    description: "Downstream transportation and distribution",
  },
  {
    id: "s3_cat_10_processing_sold",
    title: "การแปรรูปผลิตภัณฑ์ที่จำหน่าย",
    description: "Processing of sold products",
  },
  {
    id: "s3_cat_11_use_sold",
    title: "การใช้งานผลิตภัณฑ์ที่จำหน่าย",
    description: "Use of sold products",
  },
  {
    id: "s3_cat_12_end_of_life",
    title: "การจัดการซากผลิตภัณฑ์หลังหมดอายุการใช้งาน",
    description: "End-of-life treatment of sold products",
  },
  {
    id: "s3_cat_13_downstream_leased",
    title: "สินทรัพย์ที่ให้เช่าปลายน้ำ",
    description: "Downstream leased assets",
  },
  {
    id: "s3_cat_14_franchises",
    title: "แฟรนไชส์",
    description: "Franchises",
  },
  {
    id: "s3_cat_15_investments",
    title: "การลงทุน",
    description: "Investments",
  },
] as const

const SCOPE3_INFLUENCE_OPTIONS = [
  { value: 1, label: "1 — น้อยที่สุด", hint: "มีอิทธิพลจำกัดในการลดการปล่อย" },
  { value: 3, label: "3 — ปานกลาง", hint: "ควบคุมได้บางส่วน" },
  { value: 5, label: "5 — มากที่สุด", hint: "มีศักยภาพสูงในการสั่งการลดการปล่อย" },
] as const

/** ช่วง %GHG ตามเกณฑ์คะแนน Material Topic — เรียงจากน้อยไปมาก */
const SCOPE3_GHG_BAND_OPTIONS = [
  { value: 5, label: "10% หรือน้อยกว่า", hint: "คะแนน 1" },
  { value: 15, label: "มากกว่า 10% ถึง 20%", hint: "คะแนน 2" },
  { value: 25, label: "มากกว่า 20% ถึง 30%", hint: "คะแนน 3" },
  { value: 35, label: "มากกว่า 30% ถึง 40%", hint: "คะแนน 4" },
  { value: 45, label: "มากกว่า 40%", hint: "คะแนน 5 (ถ่วงน้ำหนัก × 0.60)" },
] as const

const SCOPE3_RISK_OPTIONS = [
  { value: 1, label: "อื่น ๆ — น้อย", hint: "ความเสี่ยงต่อชื่อเสียงหรือการปฏิบัติตามกฎหมายต่ำ" },
  { value: 3, label: "ปานกลาง", hint: "มีความเสี่ยงในระดับกลาง" },
  { value: 5, label: "มาก", hint: "ความเสี่ยงต่อชื่อเสียงหรือการปฏิบัติตามกฎหมายสูง" },
] as const

const SCOPE3_OPPORTUNITY_LEVEL_OPTIONS = [
  { value: 1, label: "อื่น ๆ — น้อย", hint: "โอกาสทางธุรกิจจากการลดการปล่อยต่ำ" },
  { value: 3, label: "ปานกลาง", hint: "มีโอกาสในระดับกลาง" },
  { value: 5, label: "มาก", hint: "โอกาสสร้างความได้เปรียบทางธุรกิจสูง" },
] as const

/** Radio แบบแถว — ไม่มีพื้นหลัง / ไม่มีขอบ */
const S3_SELF_ASSESS_RADIO_ROW =
  "items-start !mr-0 !flex !h-auto !min-h-[4.25rem] !w-full !max-w-none py-4 pl-2 pr-4 md:!min-h-[4.75rem] md:py-5 md:pl-3 md:pr-6 [&.ant-radio-wrapper-checked]:font-medium [&.ant-radio-wrapper-checked]:text-teal-800"

/** ใช่/ไม่ใช่ — ไม่มีพื้นหลัง */
const S3_SELF_ASSESS_RADIO_BOOL =
  "!mr-0 inline-flex items-center py-0.5 [&.ant-radio-wrapper-checked]:font-semibold [&.ant-radio-wrapper-checked]:text-teal-800"

/** เลขหัวข้อย่อยในแบบประเมิน Scope 3 — สไตล์เดียวกับ SectionBlock */
const S3_QUESTION_STEP_BADGE =
  "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 px-1.5 text-xs font-bold tabular-nums text-teal-800"

function S3QuestionStepBadge({ n }: { n: number }) {
  return <span className={S3_QUESTION_STEP_BADGE}>{n}</span>
}

/** หน่วยผลผลิต — ค่า value ส่งตรงกับ backend (เช่น actionRegister3.php) */
/** ปริมาณ / ค่าตัวเลขใน Scope 1 (ใช้กับ InputNumber) */
const SCOPE1_NUMERIC_AMOUNT_RULES = [
  { required: true, message: "กรุณากรอกตัวเลข" },
  {
    validator: (_: unknown, value: number | null | undefined) => {
      if (value == null) return Promise.reject(new Error("กรุณากรอกตัวเลข"))
      if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
        return Promise.reject(new Error("กรอกเป็นตัวเลขเท่านั้น"))
      }
      if (value < 0) return Promise.reject(new Error("ต้องไม่ติดลบ"))
      return Promise.resolve()
    },
  },
] as const

const SCOPE1_WHEELS_RULES = [
  { required: true, message: "กรอกจำนวนล้อ" },
  {
    validator: (_: unknown, value: number | null | undefined) => {
      if (value == null) return Promise.reject(new Error("กรอกจำนวนล้อ"))
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return Promise.reject(new Error("กรอกจำนวนล้อเป็นจำนวนเต็ม"))
      }
      if (value < 2) return Promise.reject(new Error("จำนวนล้อต้องไม่น้อยกว่า 2"))
      return Promise.resolve()
    },
  },
] as const

/** Load ตามประเภทรถ — เก็บเป็นค่าเปอร์เซ็นต์ (0–100) */
const SCOPE1_LOAD_PERCENT_RULES = [
  { required: true, message: "กรอก % Load" },
  {
    validator: (_: unknown, value: number | null | undefined) => {
      if (value == null) return Promise.reject(new Error("กรอก % Load"))
      if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
        return Promise.reject(new Error("กรอกเป็นตัวเลขเท่านั้น"))
      }
      if (value < 0 || value > 100) return Promise.reject(new Error("ต้องอยู่ระหว่าง 0–100 %"))
      return Promise.resolve()
    },
  },
] as const

/** หมวด Scope 1 — ข้อมูลจริงตามโจทย์ */
const SCOPE1_MAIN_CATEGORIES = [
  {
    value: "stationary_combustion",
    label: "การเผาไหม้แบบคงที่ (Stationary Combustion)",
    hint: "การเผาไหม้จากแหล่งคงที่ เช่น หม้อไอน้ำ เตาเผา หรือเครื่องกำเนิดไฟประจำที่",
  },
  {
    value: "on_road",
    label: "การขนส่ง (On-road)",
    hint: "การใช้เชื้อเพลิงจากยานพาหนะบนถนน แยกตามเชื้อเพลิงและประเภทรถ",
  },
  {
    value: "off_road",
    label: "เครื่องจักร/ยานพาหนะนอกถนน (Off-road)",
    hint: "เครื่องจักรกลหรือยานพาหนะที่ไม่วิ่งบนถนนสาธารณะ",
  },
  {
    value: SCOPE1_NONE,
    label: "ไม่มีกิจกรรมใน Scope 1",
    hint: "องค์กรไม่มีการปล่อยก๊าซทางตรงจากกิจกรรมในขอบเขตที่ 1 ในช่วงรายงานนี้",
  },
] as const

type Scope1CategoryValue = (typeof SCOPE1_MAIN_CATEGORIES)[number]["value"]

type ScopeContextOption = {
  value: string
  label: string
}

type Scope1VehicleTypeDef = {
  value: string
  label: string
}

type Scope1OnRoadMode = "fuel_based" | "vehicle_based"

type Scope1ActivityCategory = Exclude<Scope1CategoryValue, typeof SCOPE1_NONE>

const SCOPE1_FUELS_BY_CATEGORY: Record<Scope1ActivityCategory, Scope1FuelDef[]> = {
  stationary_combustion: [
    {
      value: "fuel_oil_a",
      label: "น้ำมันเตา A (Fuel oil A)",
      defaultUnits: [
        { label: "ลิตร", value: "L" },
        { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
      ],
    },
    {
      value: "fuel_oil_c",
      label: "น้ำมันเตา C (Fuel oil C)",
      defaultUnits: [
        { label: "ลิตร", value: "L" },
        { label: "ลูกบาศก์เมตร (m³)", value: "m3" },
      ],
    },
    {
      value: "diesel_gas_oil",
      label: "น้ำมันดีเซล / แก๊สออยล์ (Gas/Diesel oil)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "jet_kerosene",
      label: "น้ำมันเครื่องบิน (Jet Kerosene)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "motor_gasoline",
      label: "น้ำมันเบนซิน (Motor gasoline)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "lignite",
      label: "ถ่านหินลิกไนต์ (Lignite)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "anthracite",
      label: "ถ่านหินแอนทราไซต์ (Anthracite)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "sub_bituminous_coal",
      label: "ถ่านหินซับบิทูมินัส (Sub-bituminous coal)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "fuel_wood",
      label: "ไม้ฟืน (Fuel wood)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "bagasse",
      label: "กากอ้อย (Bagasse)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "palm_kernel_shell",
      label: "กะลาปาล์ม (Palm kernel shell)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "cob",
      label: "ซังข้าวโพด (Cob)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "biogas",
      label: "ก๊าซชีวภาพ (Biogas)",
      defaultUnits: [{ label: "ลูกบาศก์เมตร (m³)", value: "m3" }],
    },
    {
      value: "fuel_wood_co2_only",
      label: "ไม้ฟืน – เฉพาะ CO₂ (Fuel wood - CO2 only)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "bagasse_co2_only",
      label: "กากอ้อย – เฉพาะ CO₂ (Bagasse - CO2 only)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "palm_kernel_shell_co2_only",
      label: "กะลาปาล์ม – เฉพาะ CO₂ (Palm kernel shell - CO2 only)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "cob_co2_only",
      label: "ซังข้าวโพด – เฉพาะ CO₂ (Cob - CO2 only)",
      defaultUnits: [{ label: "ตัน", value: "t" }],
    },
    {
      value: "biogas_co2_only",
      label: "ก๊าซชีวภาพ – เฉพาะ CO₂ (Biogas - CO2 only)",
      defaultUnits: [{ label: "ลูกบาศก์เมตร (m³)", value: "m3" }],
    },
    {
      value: "natural_gas",
      label: "ก๊าซธรรมชาติ (Natural gas)",
      defaultUnits: [{ label: "ลูกบาศก์เมตร (m³)", value: "m3" }],
    },
    {
      value: "lpg",
      label: "ก๊าซปิโตรเลียมเหลว (LPG)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
  ],
  on_road: [
    {
      value: "cng",
      label: "ก๊าซธรรมชาติอัด (Compressed Natural Gas: CNG)",
      defaultUnits: [{ label: "ลูกบาศก์เมตร (m³)", value: "m3" }],
    },
    {
      value: "lpg",
      label: "ก๊าซปิโตรเลียมเหลว (Liquefied Petroleum Gas: LPG)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "diesel_gas_oil",
      label: "น้ำมันดีเซล / แก๊สออยล์ (Gas/Diesel oil)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "motor_gasoline_uncontrolled",
      label: "น้ำมันเบนซิน – ไม่มีระบบควบคุมไอเสีย (Motor gasoline - uncontrolled)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "motor_gasoline_oxidation_catalyst",
      label: "น้ำมันเบนซิน – มีตัวเร่งปฏิกิริยา (Motor gasoline - oxidation catalyst)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "motor_gasoline_low_mileage_light_duty",
      label: "น้ำมันเบนซิน – รถใช้งานน้อย / ระยะทางต่ำ (Motor gasoline - low mileage light duty)",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
  ],
  off_road: [
    {
      value: "diesel",
      label: "Diesel",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "gasoline_2_stroke",
      label: "Gasoline 2 จังหวะ",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
    {
      value: "gasoline_4_stroke",
      label: "Gasoline 4 จังหวะ",
      defaultUnits: [{ label: "ลิตร", value: "L" }],
    },
  ],
}

const SCOPE1_SECTOR_OPTIONS: ScopeContextOption[] = [
  { value: "agriculture", label: "เกษตรกรรม" },
  { value: "forestry", label: "ป่าไม้" },
  { value: "industry", label: "อุตสาหกรรม" },
  { value: "household", label: "ครัวเรือน" },
]

const SCOPE1_ONROAD_MODES: { value: Scope1OnRoadMode; label: string; hint: string }[] = [
  { value: "fuel_based", label: "กรอกตามเชื้อเพลิง", hint: "เลือกชนิดเชื้อเพลิงสำหรับ On-road" },
  { value: "vehicle_based", label: "กรอกตามประเภทรถ", hint: "เลือกประเภทรถสำหรับ On-road" },
]

const SCOPE1_ONROAD_VEHICLE_TYPES: Scope1VehicleTypeDef[] = [
  { value: "van_truck", label: "รถตู้บรรทุก" },
  { value: "van_truck_small", label: "รถตู้บรรทุก ขนาดเล็ก" },
  { value: "van_truck_large", label: "รถตู้บรรทุก ขนาดใหญ่" },
  { value: "open_van_truck", label: "รถตู้บรรทุกเปิด" },
  { value: "semi_trailer_van_truck", label: "รถตู้บรรทุก กึ่งพ่วง" },
  { value: "trailer_van_truck", label: "รถตู้บรรทุก พ่วง" },
  { value: "small_pickup_truck", label: "รถกระบะบรรทุก ขนาดเล็ก" },
  { value: "large_pickup_truck", label: "รถกระบะบรรทุก ขนาดใหญ่" },
  { value: "pickup_truck", label: "รถกระบะบรรทุก" },
  { value: "semi_trailer_pickup_truck", label: "รถกระบะบรรทุก กึ่งพ่วง" },
  { value: "trailer_pickup_truck", label: "รถกระบะบรรทุก พ่วง" },
  { value: "garbage_truck", label: "รถบรรทุกขยะ" },
  { value: "special_crane_truck", label: "รถบรรทุกเฉพาะกิจ (ติดเครน)" },
  { value: "cement_mixer_truck", label: "รถบรรทุกซีเมนต์ชนิดโม่" },
  { value: "cement_powder_bucket", label: "รถบรรทุกซีเมนต์ผง (ชนิดเต้า/ชนิดถ้วย)" },
  { value: "cement_powder_banana", label: "รถบรรทุกซีเมนต์ผง (ชนิดกล้วย)" },
]

const SCOPE1_CONDITION_OPTIONS: ScopeContextOption[] = [
  { value: "normal", label: "รถวิ่งแบบปกติ" },
  { value: "rough", label: "รถวิ่งแบบสมบุกสมบัน" },
  { value: "mixed", label: "รถวิ่งแบบปกติและสมบุกสมบัน" },
]

/** หน่วยระยะทาง — On-road แบบประเภทรถ */
const SCOPE1_VEHICLE_DISTANCE_UNIT_OPTIONS: ScopeContextOption[] = [
  { value: "km", label: "กิโลเมตร (km)" },
  { value: "mi", label: "ไมล์ (mi)" },
  { value: "m", label: "เมตร (m)" },
]

function getScope1ActivityUnitOptions(
  category: Scope1CategoryValue,
  activityKey: string | undefined,
  onRoadMode: Scope1OnRoadMode | undefined,
  fuelsByCategory: Record<Scope1ActivityCategory, Scope1FuelDef[]> = SCOPE1_FUELS_BY_CATEGORY,
): { label: string; value: string }[] {
  if (!activityKey || category === SCOPE1_NONE) return []
  if (category === "on_road" && onRoadMode === "vehicle_based") {
    if (SCOPE1_ONROAD_VEHICLE_TYPES.some((v) => v.value === activityKey)) {
      return [{ label: "กิโลเมตร (km)", value: "km" }]
    }
    return []
  }
  const fuel = (fuelsByCategory[category as Scope1ActivityCategory] ?? []).find((f) => f.value === activityKey)
  return fuel ? fuel.defaultUnits.map((u) => ({ ...u })) : []
}

function getScope1ActivityLabel(
  category: Scope1CategoryValue,
  activityKey: string | undefined,
  onRoadMode: Scope1OnRoadMode | undefined,
  fuelsByCategory: Record<Scope1ActivityCategory, Scope1FuelDef[]> = SCOPE1_FUELS_BY_CATEGORY,
): string | undefined {
  if (!activityKey || category === SCOPE1_NONE) return undefined
  if (category === "on_road" && onRoadMode === "vehicle_based") {
    return SCOPE1_ONROAD_VEHICLE_TYPES.find((v) => v.value === activityKey)?.label
  }
  return (fuelsByCategory[category as Scope1ActivityCategory] ?? []).find((f) => f.value === activityKey)?.label
}

/** Scope 2 — ตาม flow จริง: Electricity + Refrigerants */
const SCOPE2_ENERGY_TYPES = [
  {
    value: "electricity",
    label: "การใช้ไฟฟ้า (Electricity)",
    hint: "ไฟฟ้าแบบ grid mix ปี 2016–2018; LCIA method: IPCC 2013 GWP 100a V1.03",
  },
  {
    value: "refrigerants",
    label: "สารทำความเย็น (Refrigerants)",
    hint: "เลือกประเภทสารทำความเย็นและกรอกปริมาณ (kg)",
  },
  {
    value: SCOPE2_NONE,
    label: "ไม่มีกิจกรรมใน Scope 2",
    hint: "องค์กรไม่มีการใช้ไฟฟ้าหรือสารทำความเย็นที่ต้องรายงานในช่วงนี้",
  },
] as const

type Scope2EnergyTypeValue = (typeof SCOPE2_ENERGY_TYPES)[number]["value"]

/** fallback เมื่อยังโหลด ef-ui-options ไม่สำเร็จ */
const SCOPE2_REFRIGERANT_OPTIONS_FALLBACK = [
  { value: "r22_hcfc22", label: "R-22 (HCFC-22)" },
  { value: "r32", label: "R-32" },
  { value: "r125", label: "R-125" },
  { value: "r134", label: "R-134" },
  { value: "r134a", label: "R-134a" },
  { value: "r143", label: "R-143" },
  { value: "r143a", label: "R-143a" },
] as const

function mergeScope1Fuels(api: Scope1FuelDef[], staticFuels: Scope1FuelDef[]): Scope1FuelDef[] {
  const apiKeys = new Set(api.map((f) => f.value))
  const extra = staticFuels.filter((f) => !apiKeys.has(f.value))
  return [...api, ...extra]
}

/** Scope 3 กรอกข้อมูล — 15 หมวด (value สอดคล้อง id ใน SCOPE3_ASSESSMENT_CATEGORIES) */
const SCOPE3_ENTRY_ACTIVITY_TYPES = [
  {
    value: "s3_cat_1_purchased_goods",
    label: "การจัดซื้อสินค้าและบริการ",
    hint: "Purchased goods and services",
  },
  {
    value: "s3_cat_2_capital_goods",
    label: "สินทรัพย์ทุน",
    hint: "Capital goods",
  },
  {
    value: "s3_cat_3_fuel_energy_related",
    label: "กิจกรรมที่เกี่ยวข้องกับเชื้อเพลิงและพลังงาน",
    hint: "Fuel- and energy-related activities",
  },
  {
    value: "s3_cat_4_upstream_transport",
    label: "การขนส่งและกระจายสินค้าต้นน้ำ",
    hint: "Upstream transportation and distribution",
  },
  {
    value: "s3_cat_5_waste_operations",
    label: "ของเสียที่เกิดจากการดำเนินงาน",
    hint: "Waste generated in operations",
  },
  {
    value: "s3_cat_6_business_travel",
    label: "การเดินทางเพื่อธุรกิจ",
    hint: "Business travel",
  },
  {
    value: "s3_cat_7_employee_commuting",
    label: "การเดินทางของพนักงาน",
    hint: "Employee commuting",
  },
  {
    value: "s3_cat_8_upstream_leased",
    label: "สินทรัพย์ที่เช่าใช้ต้นน้ำ",
    hint: "Upstream leased assets",
  },
  {
    value: "s3_cat_9_downstream_transport",
    label: "การขนส่งและกระจายสินค้าปลายน้ำ",
    hint: "Downstream transportation and distribution",
  },
  {
    value: "s3_cat_10_processing_sold",
    label: "การแปรรูปผลิตภัณฑ์ที่จำหน่าย",
    hint: "Processing of sold products",
  },
  {
    value: "s3_cat_11_use_sold",
    label: "การใช้งานผลิตภัณฑ์ที่จำหน่าย",
    hint: "Use of sold products",
  },
  {
    value: "s3_cat_12_end_of_life",
    label: "การจัดการซากผลิตภัณฑ์หลังหมดอายุการใช้งาน",
    hint: "End-of-life treatment of sold products",
  },
  {
    value: "s3_cat_13_downstream_leased",
    label: "สินทรัพย์ที่ให้เช่าปลายน้ำ",
    hint: "Downstream leased assets",
  },
  {
    value: "s3_cat_14_franchises",
    label: "แฟรนไชส์",
    hint: "Franchises",
  },
  {
    value: "s3_cat_15_investments",
    label: "การลงทุน",
    hint: "Investments",
  },
] as const

type Scope3EntryActivityValue = (typeof SCOPE3_ENTRY_ACTIVITY_TYPES)[number]["value"]

const S3_DISPOSAL_METHOD_OPTIONS = [
  { value: "landfill", label: "ฝังกลบ" },
  { value: "incineration", label: "เผา" },
  { value: "recycle", label: "รีไซเคิล" },
] as const

const S3_TRANSPORT_MODE_OPTIONS = [
  { value: "distance", label: "ระยะทาง (km)" },
  { value: "fuel", label: "เชื้อเพลิง (ลิตร)" },
] as const

const S3_TRANSPORT_TYPE_OPTIONS = [
  { value: "road", label: "รถ" },
  { value: "sea", label: "เรือ" },
  { value: "air", label: "เครื่องบิน" },
] as const

const S3_CAPITAL_ASSET_TYPE_OPTIONS = [
  { value: "building", label: "อาคาร" },
  { value: "machinery", label: "เครื่องจักร" },
] as const

const S3_ENERGY_KIND_OPTIONS = [
  { value: "electricity", label: "ไฟฟ้า" },
  { value: "fuel", label: "เชื้อเพลิง" },
] as const

const S3_ENERGY_USE_UNIT_OPTIONS = [
  { value: "kWh", label: "kWh" },
  { value: "litre", label: "ลิตร (L)" },
] as const

const S3_PURCHASE_QTY_UNIT_OPTIONS = [
  { value: "kg", label: "กิโลกรัม (kg)" },
  { value: "unit", label: "หน่วย (unit)" },
] as const

/** ตัวเลือกรูปแบบการกรอก — ใช้กับ Select อิงแพทเทิร์น Scope 1 On-road */
const S3_PURCHASE_ENTRY_MODE_OPTIONS = [
  { value: "baht", label: "ตามมูลค่า (บาท)" },
  { value: "quantity", label: "ตามปริมาณ (kg / unit)" },
] as const

const S3_BUSINESS_TRAVEL_ENTRY_MODE_OPTIONS = [
  { value: "distance", label: "ระยะทาง (km)" },
  { value: "expense", label: "ค่าใช้จ่าย (บาท)" },
] as const

/** คำอธิบายสั้น ๆ ต่อรายการใน Form.List — แสดงในการ์ดแต่ละแถว */
const SCOPE3_ROW_HINTS: Record<Scope3EntryActivityValue, string> = {
  s3_cat_1_purchased_goods:
    "สินค้าและบริการที่จัดซื้อ กำหนดประเภทสินค้า/บริการ แล้วเลือกกรอกตามมูลค่า (บาท) หรือตามปริมาณพร้อมหน่วย (kg / unit)",
  s3_cat_2_capital_goods:
    "สินทรัพย์ถาวรที่จัดซื้อ เช่น อาคาร เครื่องจักร ระบุมูลค่าและจำนวนหน่วยที่เกี่ยวข้อง",
  s3_cat_3_fuel_energy_related:
    "พลังงานที่เกี่ยวเนื่องกับการจัดซื้อและการใช้ (นอก Scope 1–2 โดยตรง) ระบุประเภทพลังงาน ปริมาณ และหน่วย",
  s3_cat_4_upstream_transport:
    "การขนส่งและกระจายสินค้าต้นน้ำ เลือกประเมินจากระยะทางหรือจากปริมาณเชื้อเพลิง ระบุประเภทการขนส่ง น้ำหนักสินค้า และข้อมูลตามรูปแบบที่เลือก",
  s3_cat_5_waste_operations:
    "ของเสียจากการดำเนินงาน ระบุประเภทของเสีย ปริมาณ และวิธีจัดการ (ฝังกลบ / เผา / รีไซเคิล)",
  s3_cat_6_business_travel:
    "การเดินทางเพื่อธุรกิจ เลือกกรอกจากระยะทาง (km) หรือจากค่าใช้จ่าย (บาท) ระบุประเภทการเดินทางให้ชัดเจน",
  s3_cat_7_employee_commuting:
    "การเดินทางของพนักงาน ระบุจำนวนพนักงาน ระยะทางเฉลี่ย จำนวนวันทำงาน และวิธีเดินทางหลัก",
  s3_cat_8_upstream_leased:
    "ทรัพย์สินที่เช่าใช้ต้นน้ำ ระบุประเภททรัพย์สิน การใช้พลังงาน และหน่วย (เช่น kWh หรือลิตร)",
  s3_cat_9_downstream_transport:
    "การขนส่งและกระจายสินค้าปลายน้ำ เลือกประเมินจากระยะทางหรือจากเชื้อเพลิง ระบุประเภทการขนส่งและน้ำหนักสินค้า",
  s3_cat_10_processing_sold:
    "การแปรรูปผลิตภัณฑ์ที่จำหน่าย ระบุประเภทสินค้าและปริมาณที่เกี่ยวข้องกับกระบวนการแปรรูป",
  s3_cat_11_use_sold:
    "การใช้งานผลิตภัณฑ์ที่จำหน่าย ระบุจำนวนที่ขาย พลังงานต่อหน่วย และอายุการใช้งานโดยประมาณ",
  s3_cat_12_end_of_life:
    "การจัดการซากผลิตภัณฑ์หลังหมดอายุ ระบุประเภทสินค้า ปริมาณ และวิธีจัดการท้ายชีวิต",
  s3_cat_13_downstream_leased:
    "สินทรัพย์ที่ให้เช่าปลายน้ำ ระบุประเภททรัพย์สิน การใช้พลังงาน และหน่วย",
  s3_cat_14_franchises:
    "แฟรนไชส์ ระบุจำนวนสาขา การใช้พลังงานรวม และรายได้รวม (ถ้ามี) เพื่อสะท้อนขอบเขตการปล่อย",
  s3_cat_15_investments:
    "การลงทุนในหน่วยงานอื่น ระบุประเภทการลงทุน มูลค่า และสัดส่วนการถือหุ้น (%) ถ้าใช้ในการปันส่วน",
}

type Scope3ProgressItem = {
  key: string
  label: string
  rowSummaries: string[]
}

function pickScope3OptionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: unknown,
): string {
  if (value == null || value === "") return ""
  const hit = options.find((o) => o.value === value)
  return hit?.label ?? String(value)
}

function summarizeScope3Row(cat: Scope3EntryActivityValue, row: Record<string, unknown>): string {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
  const txt = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "")

  switch (cat) {
    case "s3_cat_1_purchased_goods": {
      const bits: string[] = []
      if (txt(row.product_service_type)) bits.push(txt(row.product_service_type))
      if (row.entry_mode === "baht" && num(row.amount) != null) bits.push(`${num(row.amount)} บาท`)
      else if (row.entry_mode === "quantity" && num(row.amount) != null) {
        bits.push(`${num(row.amount)} ${pickScope3OptionLabel(S3_PURCHASE_QTY_UNIT_OPTIONS, row.quantity_unit)}`.trim())
      }
      return bits.join(" · ") || "มีข้อมูลบางส่วน"
    }
    case "s3_cat_2_capital_goods":
      return [
        pickScope3OptionLabel(S3_CAPITAL_ASSET_TYPE_OPTIONS, row.asset_type),
        num(row.value_baht) != null ? `${num(row.value_baht)} บาท` : "",
        num(row.count) != null ? `${num(row.count)} หน่วย` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_3_fuel_energy_related":
      return [
        pickScope3OptionLabel(S3_ENERGY_KIND_OPTIONS, row.energy_kind),
        num(row.amount) != null ? `${num(row.amount)}` : "",
        pickScope3OptionLabel(S3_ENERGY_USE_UNIT_OPTIONS, row.unit),
      ]
        .filter(Boolean)
        .join(" ") || "มีข้อมูลบางส่วน"
    case "s3_cat_4_upstream_transport":
    case "s3_cat_9_downstream_transport":
      return [
        pickScope3OptionLabel(S3_TRANSPORT_TYPE_OPTIONS, row.transport_type),
        row.entry_mode === "fuel" && num(row.fuel_litres) != null
          ? `เชื้อเพลิง ${num(row.fuel_litres)} ลิตร`
          : num(row.distance_km) != null
            ? `ระยะทาง ${num(row.distance_km)} km`
            : "",
        num(row.cargo_weight) != null ? `น้ำหนัก ${num(row.cargo_weight)} kg` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_5_waste_operations":
      return [
        txt(row.waste_type),
        num(row.amount) != null ? `ปริมาณ ${num(row.amount)}` : "",
        pickScope3OptionLabel(S3_DISPOSAL_METHOD_OPTIONS, row.disposal_method),
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_6_business_travel":
      return [
        txt(row.travel_type),
        row.entry_mode === "expense" && num(row.expense_baht) != null
          ? `${num(row.expense_baht)} บาท`
          : num(row.distance_km) != null
            ? `${num(row.distance_km)} km`
            : "",
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_7_employee_commuting":
      return [
        num(row.employee_count) != null ? `พนักงาน ${num(row.employee_count)} คน` : "",
        num(row.avg_distance_km) != null ? `เฉลี่ย ${num(row.avg_distance_km)} km` : "",
        num(row.work_days) != null ? `${num(row.work_days)} วัน` : "",
        txt(row.commute_mode),
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_8_upstream_leased":
    case "s3_cat_13_downstream_leased":
      return [
        txt(row.asset_kind),
        num(row.energy_use) != null ? `พลังงาน ${num(row.energy_use)}` : "",
        pickScope3OptionLabel(S3_ENERGY_USE_UNIT_OPTIONS, row.energy_unit),
      ]
        .filter(Boolean)
        .join(" ") || "มีข้อมูลบางส่วน"
    case "s3_cat_10_processing_sold":
      return [txt(row.product_type), num(row.amount) != null ? `ปริมาณ ${num(row.amount)}` : ""]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_11_use_sold":
      return [
        txt(row.product_type),
        num(row.units_sold) != null ? `ขาย ${num(row.units_sold)} หน่วย` : "",
        num(row.energy_per_unit) != null ? `พลังงาน/หน่วย ${num(row.energy_per_unit)}` : "",
        txt(row.lifetime),
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_12_end_of_life":
      return [
        txt(row.product_type),
        num(row.amount) != null ? `ปริมาณ ${num(row.amount)}` : "",
        pickScope3OptionLabel(S3_DISPOSAL_METHOD_OPTIONS, row.disposal_method),
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_14_franchises":
      return [
        num(row.outlet_count) != null ? `${num(row.outlet_count)} สาขา` : "",
        num(row.total_energy) != null ? `พลังงาน ${num(row.total_energy)}` : "",
        num(row.revenue_baht) != null ? `รายได้ ${num(row.revenue_baht)} บาท` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    case "s3_cat_15_investments":
      return [
        txt(row.investment_type),
        num(row.value_baht) != null ? `${num(row.value_baht)} บาท` : "",
        num(row.equity_pct) != null ? `ถือหุ้น ${num(row.equity_pct)}%` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "มีข้อมูลบางส่วน"
    default:
      return "มีข้อมูลบางส่วน"
  }
}

function buildScope3FilledEntries(
  entries: Record<string, unknown[]> | undefined,
): Scope3ProgressItem[] {
  return SCOPE3_ENTRY_ACTIVITY_TYPES.flatMap((c) => {
    const rows = entries?.[c.value]
    const filled = Array.isArray(rows)
      ? rows.filter((r) => isScope3EntryRowMeaningful(r))
      : []
    if (filled.length === 0) return []
    return [
      {
        key: c.value,
        label: c.label,
        rowSummaries: filled.map((r) =>
          summarizeScope3Row(c.value, r as Record<string, unknown>),
        ),
      },
    ]
  })
}

function Scope3EntrySummaryFloat({
  items,
  activeKey,
  onSelect,
}: {
  items: Scope3ProgressItem[]
  activeKey?: string
  onSelect: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null

  const totalRows = items.reduce((n, i) => n + i.rowSummaries.length, 0)

  return (
    <>
      <button
        type="button"
        aria-label={`สรุปข้อมูล Scope 3 ที่กรอกแล้ว ${items.length} หมวด`}
        onClick={() => setOpen(true)}
        className="signature-gradient fixed bottom-[5.75rem] right-4 z-30 flex min-w-[3.25rem] flex-col items-center justify-center rounded-full border-0 px-3 py-2.5 text-white shadow-[0_8px_28px_rgba(0,81,63,0.38)] transition hover:scale-[1.03] hover:shadow-[0_10px_32px_rgba(0,81,63,0.45)] md:bottom-8 md:right-8 md:min-w-[3.75rem] md:px-3.5 md:py-3"
      >
        <span className="text-base font-bold leading-none tabular-nums md:text-lg">{items.length}</span>
        <span className="mt-0.5 text-[10px] font-semibold leading-none text-white/90 md:text-[11px]">สรุป</span>
      </button>

      <Drawer
        title={
          <div>
            <div className="text-base font-semibold text-[#00513f]">ข้อมูล Scope 3 ที่กรอกแล้ว</div>
            <Typography.Text type="secondary" className="!text-xs">
              {items.length} หมวด · {totalRows} รายการ — คลิกหมวดเพื่อกลับไปดูหรือแก้ไข
            </Typography.Text>
          </div>
        }
        placement="right"
        width={360}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose={false}
        className="scope3-entry-summary-drawer"
      >
        <ul className="m-0 list-none space-y-3 p-0">
          {items.map((item) => {
            const catIdx = SCOPE3_ENTRY_ACTIVITY_TYPES.findIndex((c) => c.value === item.key)
            const isActive = activeKey === item.key
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item.key)
                    setOpen(false)
                  }}
                  className={[
                    "w-full rounded-xl border px-3 py-3 text-left transition",
                    isActive
                      ? "border-[#0d9488] bg-teal-50/90 shadow-sm ring-1 ring-teal-200/80"
                      : "border-slate-200/90 bg-white hover:border-teal-200 hover:bg-slate-50/80",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00513f] text-xs font-bold text-white">
                      {catIdx >= 0 ? catIdx + 1 : "·"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-snug text-slate-800">{item.label}</div>
                      <ul className="mt-2 space-y-1.5">
                        {item.rowSummaries.map((summary, rowIdx) => (
                          <li
                            key={`${item.key}-${rowIdx}`}
                            className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-relaxed text-slate-600"
                          >
                            <span className="font-medium text-teal-800">รายการ {rowIdx + 1}: </span>
                            {summary}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <CheckCircleOutlined className="mt-1 shrink-0 text-[#0d9488]" aria-hidden />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </Drawer>
    </>
  )
}

const S3_REQUIRED = { required: true as const, message: "กรุณากรอกข้อมูล" }
const S3_REQUIRED_SELECT = { required: true as const, message: "กรุณาเลือก" }

/** แถวฟอร์ม Scope 3 ใน Form.List — path: scope3_cat_entries[cat][index].field */
function Scope3CategoryEntryRowBody({
  cat,
  field,
}: {
  cat: Scope3EntryActivityValue
  field: { name: number; key: Key }
}) {
  const form = Form.useFormInstance()
  const p = (key: string): [number, string] => [field.name, key]

  const blk = (title: string, children: ReactNode) => (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-4 py-4 sm:px-5 sm:py-5">
      <Typography.Text className="mb-3 block text-sm font-semibold text-slate-700">{title}</Typography.Text>
      <div className="space-y-1">{children}</div>
    </div>
  )

  switch (cat) {
    case "s3_cat_1_purchased_goods":
      return (
        <div className="space-y-4">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name={p("entry_mode")} label="รูปแบบการกรอก" rules={[S3_REQUIRED_SELECT]}>
                <Select
                  placeholder="เลือก"
                  options={S3_PURCHASE_ENTRY_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={() => {
                    form.setFields([
                      { name: ["scope3_cat_entries", cat, field.name, "amount"], value: undefined },
                      { name: ["scope3_cat_entries", cat, field.name, "quantity_unit"], value: undefined },
                    ])
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name={p("product_service_type")} label="ประเภทสินค้า/บริการ" rules={[S3_REQUIRED]}>
            <Input placeholder="ระบุประเภทสินค้าหรือบริการ" />
          </Form.Item>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item noStyle dependencies={[["scope3_cat_entries", cat, field.name, "entry_mode"]]}>
                {() => {
                  const mode = form.getFieldValue([
                    "scope3_cat_entries",
                    cat,
                    field.name,
                    "entry_mode",
                  ]) as "baht" | "quantity" | undefined
                  const label = mode === "baht" ? "มูลค่า (บาท)" : "ปริมาณ"
                  return (
                    <Form.Item
                      name={p("amount")}
                      label={label}
                      rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}
                      tooltip={mode === "quantity" ? "กรอกปริมาณตามหน่วยที่เลือก" : undefined}
                    >
                      <InputNumber min={0} className="!w-full" placeholder="ตัวเลข" />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item noStyle dependencies={[["scope3_cat_entries", cat, field.name, "entry_mode"]]}>
                {() => {
                  const mode = form.getFieldValue(["scope3_cat_entries", cat, field.name, "entry_mode"])
                  if (mode !== "quantity") return null
                  return (
                    <Form.Item name={p("quantity_unit")} label="หน่วยปริมาณ" rules={[S3_REQUIRED_SELECT]}>
                      <Select placeholder="เลือกหน่วย" options={[...S3_PURCHASE_QTY_UNIT_OPTIONS]} />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    case "s3_cat_2_capital_goods":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("asset_type")} label="ประเภทสินทรัพย์" rules={[S3_REQUIRED_SELECT]}>
                <Select placeholder="เลือก" options={[...S3_CAPITAL_ASSET_TYPE_OPTIONS]} />
              </Form.Item>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name={p("value_baht")} label="มูลค่า (บาท)" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="บาท" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={p("count")} label="จำนวน" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} step={1} className="!w-full" placeholder="จำนวนหน่วย" />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_3_fuel_energy_related":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("energy_kind")} label="ประเภทพลังงาน" rules={[S3_REQUIRED_SELECT]}>
                <Select placeholder="เลือก" options={[...S3_ENERGY_KIND_OPTIONS]} />
              </Form.Item>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name={p("amount")} label="ปริมาณ" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="ตัวเลข" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={p("unit")} label="หน่วย" rules={[S3_REQUIRED_SELECT]}>
                    <Select placeholder="kWh / ลิตร" options={[...S3_ENERGY_USE_UNIT_OPTIONS]} />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_4_upstream_transport":
    case "s3_cat_9_downstream_transport":
      return (
        <div className="space-y-4">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name={p("entry_mode")} label="รูปแบบการกรอก" rules={[S3_REQUIRED_SELECT]}>
                <Select
                  placeholder="เลือก"
                  options={S3_TRANSPORT_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={() => {
                    form.setFields([
                      { name: ["scope3_cat_entries", cat, field.name, "distance_km"], value: undefined },
                      { name: ["scope3_cat_entries", cat, field.name, "fuel_litres"], value: undefined },
                    ])
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={p("transport_type")} label="ประเภทการขนส่ง" rules={[S3_REQUIRED_SELECT]}>
                <Select placeholder="เลือก" options={[...S3_TRANSPORT_TYPE_OPTIONS]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item noStyle dependencies={[["scope3_cat_entries", cat, field.name, "entry_mode"]]}>
                {() => {
                  const mode = form.getFieldValue(["scope3_cat_entries", cat, field.name, "entry_mode"])
                  if (mode === "fuel")
                    return (
                      <Form.Item
                        name={p("fuel_litres")}
                        label="เชื้อเพลิง (ลิตร)"
                        rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}
                      >
                        <InputNumber min={0} className="!w-full" placeholder="ลิตร" />
                      </Form.Item>
                    )
                  return (
                    <Form.Item name={p("distance_km")} label="ระยะทาง (km)" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                      <InputNumber min={0} className="!w-full" placeholder="km" />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={p("cargo_weight")} label="น้ำหนักสินค้า (kg)" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                <InputNumber min={0} className="!w-full" placeholder="kg" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    case "s3_cat_5_waste_operations":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("waste_type")} label="ประเภทของเสีย" rules={[S3_REQUIRED]}>
                <Input placeholder="ระบุประเภทของเสีย" />
              </Form.Item>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name={p("amount")} label="ปริมาณ" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="เช่น kg" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={p("disposal_method")} label="วิธีจัดการ" rules={[S3_REQUIRED_SELECT]}>
                    <Select placeholder="เลือก" options={[...S3_DISPOSAL_METHOD_OPTIONS]} />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_6_business_travel":
      return (
        <div className="space-y-4">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name={p("entry_mode")} label="รูปแบบการกรอก" rules={[S3_REQUIRED_SELECT]}>
                <Select
                  placeholder="เลือก"
                  options={S3_BUSINESS_TRAVEL_ENTRY_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={() => {
                    form.setFields([
                      { name: ["scope3_cat_entries", cat, field.name, "distance_km"], value: undefined },
                      { name: ["scope3_cat_entries", cat, field.name, "expense_baht"], value: undefined },
                    ])
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name={p("travel_type")} label="ประเภทการเดินทาง" rules={[S3_REQUIRED]}>
            <Input placeholder="เช่น เที่ยวบิน รถไฟ" />
          </Form.Item>
          <Form.Item noStyle dependencies={[["scope3_cat_entries", cat, field.name, "entry_mode"]]}>
            {() => {
              const mode = form.getFieldValue(["scope3_cat_entries", cat, field.name, "entry_mode"])
              if (mode === "expense")
                return (
                  <Form.Item name={p("expense_baht")} label="ค่าใช้จ่าย (บาท)" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full md:max-w-md" placeholder="บาท" />
                  </Form.Item>
                )
              return (
                <Form.Item name={p("distance_km")} label="ระยะทาง (km)" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                  <InputNumber min={0} className="!w-full md:max-w-md" placeholder="km" />
                </Form.Item>
              )
            }}
          </Form.Item>
        </div>
      )
    case "s3_cat_7_employee_commuting":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item name={p("employee_count")} label="จำนวนพนักงาน" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} step={1} className="!w-full" placeholder="คน" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={p("avg_distance_km")} label="ระยะทางเฉลี่ย (km)" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="km" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={p("work_days")} label="จำนวนวัน" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} step={1} className="!w-full" placeholder="วันทำงาน" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name={p("commute_mode")} label="วิธีเดินทาง" rules={[S3_REQUIRED]}>
                    <Input placeholder="เช่น รถส่วนตัว รถเมล์" />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_8_upstream_leased":
    case "s3_cat_13_downstream_leased":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("asset_kind")} label="ประเภททรัพย์สิน" rules={[S3_REQUIRED]}>
                <Input placeholder="ระบุประเภททรัพย์สินที่เช่า" />
              </Form.Item>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name={p("energy_use")} label="การใช้พลังงาน" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="ปริมาณ" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={p("energy_unit")} label="หน่วย" rules={[S3_REQUIRED_SELECT]}>
                    <Select placeholder="kWh / ลิตร" options={[...S3_ENERGY_USE_UNIT_OPTIONS]} />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_10_processing_sold":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("product_type")} label="ประเภทสินค้า" rules={[S3_REQUIRED]}>
                <Input placeholder="ระบุประเภทสินค้า" />
              </Form.Item>
              <Form.Item name={p("amount")} label="ปริมาณ" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                <InputNumber min={0} className="!w-full max-w-md" placeholder="ตัวเลข" />
              </Form.Item>
            </>,
          )}
        </div>
      )
    case "s3_cat_11_use_sold":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("product_type")} label="ประเภทสินค้า" rules={[S3_REQUIRED]}>
                <Input placeholder="ระบุประเภทสินค้า" />
              </Form.Item>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name={p("units_sold")} label="จำนวนที่ขาย" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="หน่วยขาย" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={p("energy_per_unit")}
                    label="การใช้พลังงานต่อหน่วย"
                    rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}
                    tooltip="เช่น kWh/ชิ้น หรือค่าที่ใช้ในวิธีรายงานขององค์กร"
                  >
                    <InputNumber min={0} className="!w-full" placeholder="ตัวเลข" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name={p("lifetime")} label="อายุการใช้งาน" rules={[S3_REQUIRED]}>
                    <Input placeholder="เช่น 5 ปี หรือ 10,000 ชั่วโมง" />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_12_end_of_life":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("product_type")} label="ประเภทสินค้า" rules={[S3_REQUIRED]}>
                <Input placeholder="ระบุประเภทสินค้า" />
              </Form.Item>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name={p("amount")} label="ปริมาณ" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="ตัวเลข" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name={p("disposal_method")} label="วิธีจัดการ" rules={[S3_REQUIRED_SELECT]}>
                    <Select placeholder="เลือก" options={[...S3_DISPOSAL_METHOD_OPTIONS]} />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_14_franchises":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item name={p("outlet_count")} label="จำนวนสาขา" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} step={1} className="!w-full" placeholder="แห่ง" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={p("total_energy")} label="การใช้พลังงานรวม" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="เช่น kWh" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name={p("revenue_baht")} label="รายได้รวม (บาท) — ไม่บังคับ">
                    <InputNumber min={0} className="!w-full" placeholder="ถ้ามี" />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    case "s3_cat_15_investments":
      return (
        <div className="space-y-4">
          {blk(
            "ข้อมูล",
            <>
              <Form.Item name={p("investment_type")} label="ประเภทการลงทุน" rules={[S3_REQUIRED]}>
                <Input placeholder="ระบุประเภทการลงทุน" />
              </Form.Item>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name={p("value_baht")} label="มูลค่า (บาท)" rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}>
                    <InputNumber min={0} className="!w-full" placeholder="บาท" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={p("equity_pct")}
                    label="สัดส่วนการถือหุ้น (%)"
                    rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}
                  >
                    <InputNumber min={0} max={100} className="!w-full" placeholder="0–100" />
                  </Form.Item>
                </Col>
              </Row>
            </>,
          )}
        </div>
      )
    default:
      return null
  }
}

/** Form.List หลายรายการต่อหมวด — ดีไซน์อิงการ์ด Scope 1 / ชุดข้อมูล Scope 2 */
function Scope3CategoryEntryForm({ cat }: { cat: Scope3EntryActivityValue }) {
  const form = Form.useFormInstance()

  useEffect(() => {
    const rows = form.getFieldValue(["scope3_cat_entries", cat]) as unknown[] | undefined
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      form.setFieldValue(["scope3_cat_entries", cat], [{}])
    }
  }, [cat, form])

  return (
    <Form.List
      name={["scope3_cat_entries", cat]}
      rules={[
        {
          validator: async (_, value) => {
            if (!value || !Array.isArray(value) || value.length < 1) {
              return Promise.reject(new Error("เพิ่มอย่างน้อย 1 รายการ"))
            }
            return Promise.resolve()
          },
        },
      ]}
    >
      {(fields, { add, remove }) => (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.key}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Typography.Text className="text-sm font-semibold text-slate-800">
                  รายการที่ {index + 1}
                </Typography.Text>
                {fields.length > 1 ? (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  >
                    ลบรายการ
                  </Button>
                ) : null}
              </div>
              <div className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-teal-800">คำแนะนำ: </span>
                {SCOPE3_ROW_HINTS[cat]}
              </div>
              <Scope3CategoryEntryRowBody cat={cat} field={field} />
            </div>
          ))}
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})} className="!h-11">
            เพิ่มรายการในหมวดนี้
          </Button>
        </div>
      )}
    </Form.List>
  )
}

const { useBreakpoint } = Grid

function SectionBlock({
  step,
  title,
  description,
  children,
  sectionId,
}: {
  step: string
  title: string
  description?: string
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
          {step ? (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-teal-50 px-1.5 text-xs font-bold tabular-nums text-teal-800">
              {step}
            </span>
          ) : null}
          <Typography.Title level={5} className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base">
            {title}
          </Typography.Title>
        </div>
        {description ? (
          <Typography.Paragraph type="secondary" className="!mb-4 !text-sm !leading-relaxed">
            {description}
          </Typography.Paragraph>
        ) : null}
        <div>{children}</div>
      </div>
    </section>
  )
}

type MaterialTopicSummaryItem = {
  id: string
  title: string
  total: number
}

function buildMaterialTopicSummaries(
  assessments: unknown,
): MaterialTopicSummaryItem[] {
  if (!Array.isArray(assessments)) return []
  const items: MaterialTopicSummaryItem[] = []
  for (const cat of SCOPE3_ASSESSMENT_CATEGORIES) {
    const idx = SCOPE3_ASSESSMENT_CATEGORIES.findIndex((c) => c.id === cat.id)
    const row = assessments[idx]
    const resolved =
      row && typeof row === "object" && (row as { categoryId?: string }).categoryId === cat.id
        ? row
        : assessments.find(
            (r) =>
              r &&
              typeof r === "object" &&
              (r as { categoryId?: string }).categoryId === cat.id,
          )
    const ev = evaluateMaterialTopic(cat.id, resolved as Parameters<typeof evaluateMaterialTopic>[1])
    if (ev.isMaterial) {
      items.push({ id: cat.id, title: cat.title, total: ev.total })
    }
  }
  return items
}

function MaterialTopicScope3Alert({
  items,
  variant = "warning",
  showNextHint = false,
}: {
  items: MaterialTopicSummaryItem[]
  variant?: "warning" | "info"
  showNextHint?: boolean
}) {
  if (items.length === 0) return null
  return (
    <Alert
      type={variant}
      showIcon
      className="!mb-6"
      message={`ต้องกรอกขอบเขตที่ 3 — พบ ${items.length} หมวดที่เป็น Material Topic`}
      description={
        <div className="space-y-2 text-sm leading-relaxed">
          <p>
            เนื่องจากหมวดต่อไปนี้มีคะแนนรวม (Total) ≥ {MATERIAL_TOPIC_THRESHOLD} จากสูตรถ่วงน้ำหนัก
            (%GHG × 0.60) + (อิทธิพล × 0.20) + (ความเสี่ยง × 0.10) + (โอกาส × 0.10) และมีกิจกรรมในองค์กร
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {items.map((item) => (
              <li key={item.id}>
                <span className="font-medium text-slate-800">{item.title}</span>
                {" — "}Total {formatMaterialTotal(item.total)}
              </li>
            ))}
          </ul>
          {showNextHint ? (
            <p className="!mb-0 text-xs text-slate-600">
              กด <strong>ถัดไป</strong> เพื่อกรอกรายละเอียดในขอบเขตที่ 3 ก่อนคำนวณ
            </p>
          ) : null}
        </div>
      }
    />
  )
}

export function DataInputPage() {
  const screens = useBreakpoint()
  const stepsDirection = screens.md ? "horizontal" : "vertical"
  const authUser = useAuthStore((s) => s.user)
  const authSeedKey = authUser?.email ?? authUser?.username ?? null
  const orgIdNum = useMemo(() => {
    const id = authUser?.organization_id
    if (id === undefined || id === null) return null
    const n = typeof id === "number" ? id : Number.parseInt(String(id), 10)
    return Number.isFinite(n) ? n : null
  }, [authUser?.organization_id])

  const [mainStep, setMainStep] = useState(0)
  /** หมวดกิจกรรมปัจจุบันในแบบประเมิน Scope 3 (wizard) */
  const [scope3AssessmentCategoryIndex, setScope3AssessmentCategoryIndex] = useState(0)
  const [loadingSave, setLoadingSave] = useState(false)
  const [scope2DataLoading, setScope2DataLoading] = useState(false)
  const [scope2DataMeta, setScope2DataMeta] = useState<Scope2DataQueryResult>({ lines: [] })
  const [efUiOptions, setEfUiOptions] = useState<EfUiOptionRead[]>([])
  const [efBridgeError, setEfBridgeError] = useState<string | null>(null)
  const [scope1FuelsByCategory, setScope1FuelsByCategory] =
    useState<Record<Scope1ActivityCategory, Scope1FuelDef[]>>(SCOPE1_FUELS_BY_CATEGORY)
  const [s2RefrigLineMetaByKey, setS2RefrigLineMetaByKey] = useState<Record<number, Scope2LineFromApi[]>>({})
  const [s2RefrigLineLoadingByKey, setS2RefrigLineLoadingByKey] = useState<Record<number, boolean>>({})
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm()

  const dateStart = Form.useWatch("date_start", form)
  const dateEnd = Form.useWatch("date_end", form)

  const scope1Category = Form.useWatch("scope1_category", form) as Scope1CategoryValue | undefined
  const scope2EnergyType = Form.useWatch("scope2_energy_type", form) as Scope2EnergyTypeValue | undefined
  const scope3EntryActivityType = Form.useWatch("scope3_entry_activity_type", form) as Scope3EntryActivityValue | undefined
  const scope3CatEntries = Form.useWatch("scope3_cat_entries", form) as Record<string, unknown[]> | undefined
  const s3SelfAssessments = Form.useWatch("s3_self_assessments", form)

  const materialTopicIds = useMemo(
    () =>
      computeMaterialTopicIds(
        s3SelfAssessments,
        SCOPE3_ASSESSMENT_CATEGORIES.map((c) => c.id),
      ),
    [s3SelfAssessments],
  )
  const hasMaterialTopics = materialTopicIds.length > 0

  const materialTopicSummaries = useMemo(
    () => buildMaterialTopicSummaries(s3SelfAssessments),
    [s3SelfAssessments],
  )

  const materialEntryTypes = useMemo(
    () => SCOPE3_ENTRY_ACTIVITY_TYPES.filter((c) => materialTopicIds.includes(c.value)),
    [materialTopicIds],
  )

  const currentAssessmentRow = Form.useWatch(["s3_self_assessments", scope3AssessmentCategoryIndex], form)
  const currentMaterialPreview = useMemo(() => {
    const cat = SCOPE3_ASSESSMENT_CATEGORIES[scope3AssessmentCategoryIndex]
    if (!cat) return null
    return evaluateMaterialTopic(cat.id, currentAssessmentRow)
  }, [currentAssessmentRow, scope3AssessmentCategoryIndex])

  const scope3FilledEntries = useMemo(
    () => buildScope3FilledEntries(scope3CatEntries),
    [scope3CatEntries],
  )

  const handleScope3CartSelect = useCallback(
    (key: string) => {
      setMainStep(4)
      form.setFieldValue("scope3_entry_activity_type", key)
      window.setTimeout(() => {
        document.getElementById("data1")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    },
    [form],
  )

  const refrigerantOptions = useMemo(() => {
    const fromApi = refrigerantSelectOptions(efUiOptions)
    return fromApi.length > 0 ? fromApi : [...SCOPE2_REFRIGERANT_OPTIONS_FALLBACK]
  }, [efUiOptions])

  useEffect(() => {
    if (orgIdNum == null) return
    let cancelled = false
    ;(async () => {
      try {
        const [s1, s2] = await Promise.all([
          listEfUiOptions({ scope_scid: 1 }),
          listEfUiOptions({ scope_scid: 2 }),
        ])
        if (cancelled) return
        const all = [...s1, ...s2]
        setEfUiOptions(all)
        setEfBridgeError(null)
        setScope1FuelsByCategory({
          stationary_combustion: mergeScope1Fuels(
            scope1FuelsFromEfOptions(all, "stationary_combustion"),
            SCOPE1_FUELS_BY_CATEGORY.stationary_combustion,
          ),
          on_road: mergeScope1Fuels(
            scope1FuelsFromEfOptions(all, "on_road"),
            SCOPE1_FUELS_BY_CATEGORY.on_road,
          ),
          off_road: mergeScope1Fuels(
            scope1FuelsFromEfOptions(all, "off_road"),
            SCOPE1_FUELS_BY_CATEGORY.off_road,
          ),
        })
      } catch {
        if (!cancelled) {
          setEfBridgeError("โหลดรายการ EF จากเซิร์ฟเวอร์ไม่สำเร็จ — ใช้รายการสำรอง")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orgIdNum])

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
  const orgStorageId = useMemo(() => getOrganizationStorageId(authUser), [authUser])
  const collectionGranularity = (Form.useWatch("collection_granularity", form) as PeriodGranularity | undefined) ?? "monthly"
  const reportingYear = Form.useWatch("reporting_year", form) as number | undefined
  const fnameWatch = Form.useWatch("fname", form) as string | undefined
  const lnameWatch = Form.useWatch("lname", form) as string | undefined

  const saveReadiness = useMemo(
    () =>
      evaluateSaveReadiness({
        fname: fnameWatch,
        lname: lnameWatch,
        dateStart,
        dateEnd,
      }),
    [fnameWatch, lnameWatch, dateStart, dateEnd],
  )

  const canSave = saveReadiness.canSave

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
    if (mainStep !== 0 || !orgStorageId) return
    const preferred = getPreferredGranularity(orgStorageId)
    if (!form.getFieldValue("collection_granularity")) {
      form.setFieldValue("collection_granularity", preferred)
    }
  }, [mainStep, orgStorageId, form])

  const clearRefrigerantBatchLines = useCallback((batchIndex: number, batchKey: number) => {
    form.setFieldValue(["scope2_batches", batchIndex, "lines"], [])
    setS2RefrigLineMetaByKey((p) => {
      const n = { ...p }
      delete n[batchKey]
      return n
    })
  }, [form])

  const hydrateRefrigerantBatch = useCallback(
    async (batchIndex: number, batchKey: number, refType: string) => {
      setS2RefrigLineLoadingByKey((p) => ({ ...p, [batchKey]: true }))
      try {
        const res = buildScope2RefrigerantPayload(efUiOptions, refType)
        setS2RefrigLineMetaByKey((p) => ({ ...p, [batchKey]: res.lines }))
        form.setFieldValue(["scope2_batches", batchIndex, "lines"], buildScope2LinesFormState(res))
      } catch {
        setS2RefrigLineMetaByKey((p) => {
          const n = { ...p }
          delete n[batchKey]
          return n
        })
        form.setFieldValue(["scope2_batches", batchIndex, "lines"], [])
      } finally {
        setS2RefrigLineLoadingByKey((p) => {
          const n = { ...p }
          delete n[batchKey]
          return n
        })
      }
    },
    [form, efUiOptions],
  )

  useEffect(() => {
    if (mainStep !== 2) {
      setScope2DataLoading(false)
      setS2RefrigLineLoadingByKey({})
      return
    }
    if (!scope2EnergyType) {
      setScope2DataMeta({ lines: [] })
      setScope2DataLoading(false)
      setS2RefrigLineMetaByKey({})
      setS2RefrigLineLoadingByKey({})
      return
    }
    if (scope2EnergyType === SCOPE2_NONE) {
      setScope2DataMeta({ lines: [] })
      setScope2DataLoading(false)
      setS2RefrigLineMetaByKey({})
      setS2RefrigLineLoadingByKey({})
      form.setFieldsValue({ scope2_batches: [] })
      return
    }
    if (scope2EnergyType === "refrigerants") {
      setScope2DataMeta({ lines: [] })
      setScope2DataLoading(false)
      const batches = form.getFieldValue("scope2_batches") as unknown[] | undefined
      if (!batches || batches.length === 0) {
        form.setFieldsValue({
          scope2_batches: [{ ref_type: undefined, lines: [] }],
        })
      }
      return
    }
    setScope2DataLoading(true)
    const res = buildScope2ElectricityPayload()
    setScope2DataMeta(res)
    setScope2DataLoading(false)
    form.setFieldsValue({
      scope2_batches: [{ lines: buildScope2LinesFormState(res) }],
    })
  }, [mainStep, scope2EnergyType, form])

  useEffect(() => {
    if (mainStep === 3) {
      setScope3AssessmentCategoryIndex(0)
    }
  }, [mainStep])

  useEffect(() => {
    if (mainStep !== 3) return
    const rows = form.getFieldValue("s3_self_assessments") as unknown
    const ok = Array.isArray(rows) && rows.length === SCOPE3_ASSESSMENT_CATEGORIES.length
    if (ok) return
    form.setFieldsValue({
      s3_self_assessments: SCOPE3_ASSESSMENT_CATEGORIES.map((c) => ({
        categoryId: c.id,
        presence: undefined as "yes" | "no" | undefined,
        ghgPercent: undefined as number | undefined,
        influenceLevel: undefined as 1 | 3 | 5 | undefined,
        riskLevel: undefined as 1 | 3 | 5 | undefined,
        opportunityLevel: undefined as 1 | 3 | 5 | undefined,
        sectorGuidance: undefined as "yes" | "no" | undefined,
        outsourcing: undefined as "yes" | "no" | undefined,
        employeeEngagement: undefined as "yes" | "no" | undefined,
        remark: undefined as string | undefined,
      })),
    })
  }, [mainStep, form])

  const milestoneIndex = mainStep
  const totalMilestones = 5
  const isLastMilestone = mainStep === 4 || (mainStep === 3 && !hasMaterialTopics)
  const progressPercent = Math.round(
    ((isLastMilestone ? totalMilestones : milestoneIndex + 1) / totalMilestones) * 100,
  )

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
        description: "ประเมิน Material Topic ทีละหมวด (15 หมวด)",
        icon: <CheckCircleOutlined />,
      },
      {
        title: MAIN_STEP_LABELS[4],
        description: "กรอกเฉพาะหมวดที่เป็น Material Topic",
        icon: <GlobalOutlined />,
      },
    ],
    [],
  )

  const goNext = useCallback(async () => {
    if (mainStep === 0) {
      try {
        await form.validateFields(["fname", "lname", "date_create", "v_create", "unitx", "collection_granularity"])
        const s = form.getFieldValue("date_start")
        const e = form.getFieldValue("date_end")
        if (!s || !e) {
          messageApi.error("เลือกช่วงวันที่เก็บข้อมูลให้ครบ")
          return
        }
        const g = form.getFieldValue("collection_granularity") as PeriodGranularity | undefined
        if (g) setPreferredGranularity(getOrganizationStorageId(authUser), g)
        setMainStep(1)
      } catch {
        /* validateFields แสดงข้อผิดพลาดของฟิลด์ที่มี name แล้ว */
      }
      return
    }
    if (mainStep === 1) {
      try {
        await validateScope1BeforeNext(form)
      } catch (e) {
        if (e instanceof Error && e.message === "SCOPE1_NO_ENTRIES") {
          messageApi.error("กรุณาเพิ่มและกรอกรายละเอียดอย่างน้อย 1 รายการในข้อ 2")
          document.getElementById("scope1-section-2")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        return
      }
      setMainStep(2)
      return
    }
    if (mainStep === 2) {
      try {
        await validateScope2BeforeNext(form)
      } catch {
        document.getElementById("scope2-section-2")?.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      }
      setMainStep(3)
      return
    }
    if (mainStep === 3) {
      const ids = computeMaterialTopicIds(
        form.getFieldValue("s3_self_assessments"),
        SCOPE3_ASSESSMENT_CATEGORIES.map((c) => c.id),
      )
      if (ids.length === 0) {
        messageApi.info(
          `ไม่มีหัวข้อ Material Topic (คะแนนรวม < ${MATERIAL_TOPIC_THRESHOLD}) — ข้ามการกรอกขอบเขตที่ 3 และคำนวณได้เลย`,
        )
        return
      }
      const current = form.getFieldValue("scope3_entry_activity_type") as string | undefined
      if (!current || !ids.includes(current)) {
        form.setFieldValue("scope3_entry_activity_type", ids[0])
      }
      setMainStep(4)
      return
    }
  }, [mainStep, form, authUser, messageApi])

  const goBack = useCallback(() => {
    if (mainStep === 4) {
      setMainStep(3)
      return
    }
    if (mainStep > 0) {
      setMainStep((s) => s - 1)
    }
  }, [mainStep])

  const canGoBack = mainStep > 0

  const runSave = async () => {
    if (orgIdNum == null) {
      messageApi.error("ไม่พบรหัสองค์กร — ล็อกอินใหม่หรือตรวจสอบบัญชี")
      return
    }
    if (!canSave) {
      messageApi.warning(
        saveReadiness.reasons.length > 0
          ? `ยังบันทึกไม่ได้: ${saveReadiness.reasons.join(" · ")}`
          : "กรอกข้อมูลพื้นฐานให้ครบก่อนบันทึก",
        6,
      )
      return
    }
    const bundle = buildAnnualReportingBundle(form.getFieldsValue(true))
    form.setFieldValue("annual_report_bundle", bundle)
    setLoadingSave(true)
    try {
      await saveAnnualReportBundle(orgIdNum, bundle as unknown as Record<string, unknown>)
      messageApi.success("บันทึกข้อมูลรายปีแล้ว — ไปคำนวณได้ที่หน้าการคำนวณ")
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "บันทึกไม่สำเร็จ"
      messageApi.error(msg)
    } finally {
      setLoadingSave(false)
    }
  }

  const stepContentTitle = useMemo(() => MAIN_STEP_LABELS[mainStep] ?? "", [mainStep])

  const stepContentHint = useMemo(() => {
    switch (mainStep) {
      case 0:
        return "ชื่อผู้จัดทำ วันที่ รอบเก็บข้อมูล (รายวัน/สัปดาห์/เดือน/ปี) และผลผลิตปัจจุบันตามช่วงที่เลือก"
      case 1:
        return "การปล่อยก๊าซเรือนกระจกทางตรง — เลือกหมวดกิจกรรม แล้วกรอกรายละเอียดในข้อ 2 (หลายรายการได้)"
      case 2:
        return "การปล่อยก๊าซเรือนกระจกทางอ้อม — ไฟฟ้าหรือสารทำความเย็น กรอกได้หลายรายการ"
      case 3:
        return "ประเมิน 15 หมวด — คำนวณคะแนนรวม (Total) หาก ≥ 3 ถือเป็น Material Topic และต้องกรอกขอบเขตที่ 3"
      case 4:
        return "กรอกรายละเอียดเฉพาะหมวดที่เป็น Material Topic จากแบบประเมิน"
      default:
        return ""
    }
  }, [mainStep])

  return (
    <div className="data-input-page w-full min-w-0 pb-28 md:space-y-8 md:pb-12">
      <div className="flex flex-col gap-6">
      {contextHolder}

      <PageHeader
        title="กรอกข้อมูล"
        description="ข้อมูลทั่วไป → ขอบเขต 1 → ขอบเขต 2 → แบบประเมินตนเอง → ขอบเขต 3 (เฉพาะ Material Topic)"
      />

      {efBridgeError ? (
        <Alert type="warning" showIcon message={efBridgeError} className="mb-4" />
      ) : null}

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

              <SectionBlock
                step="2"
                title="รอบการเก็บข้อมูล"
                description="เลือกความถี่แล้วเลือกช่วงจากปฏิทิน — ข้อมูลรายย่อยจะถูกรวมเป็นปีรายงานเดียวกันเมื่อคำนวณ"
              >
                <CollectionPeriodField
                  granularity={collectionGranularity}
                  dateStart={dateStart}
                  dateEnd={dateEnd}
                  reportingYear={reportingYear}
                  onGranularityChange={(g) => {
                    form.setFieldsValue({
                      collection_granularity: g,
                      date_start: undefined,
                      date_end: undefined,
                      reporting_year: undefined,
                      period_picker_value: undefined,
                    })
                    const hint = PERIOD_GRANULARITY_OPTIONS.find((o) => o.value === g)?.hint
                    if (hint) messageApi.info(hint)
                  }}
                  onPeriodApply={(payload) => {
                    form.setFieldsValue({
                      date_start: payload.start,
                      date_end: payload.end,
                      reporting_year: payload.reportingYear,
                      period_picker_value: payload.pickerValue,
                    })
                  }}
                />
                <Form.Item name="date_start" hidden rules={[{ required: true, message: "เลือกรอบเก็บข้อมูล" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="date_end" hidden rules={[{ required: true, message: "เลือกรอบเก็บข้อมูล" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="reporting_year" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="annual_report_bundle" hidden>
                  <Input />
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
                    onChange={(e) => {
                      const v = e.target.value as Scope1CategoryValue
                      if (v === SCOPE1_NONE) {
                        form.setFieldsValue({ scope1_entries: [] })
                        return
                      }
                      form.setFieldsValue({
                        scope1_entries:
                          v === "on_road" ? [{ entry_mode: "fuel_based" as Scope1OnRoadMode }] : [{}],
                      })
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

              <SectionBlock
                step="2"
                title="ข้อมูลปริมาณตามกิจกรรมที่เลือก"
                sectionId="scope1-section-2"
              >
                {!scope1Category ? (
                  <Typography.Text type="secondary" className="text-sm">
                    เลือกหมวดกิจกรรมในข้อ 1 ก่อน จากนั้นกรอกได้หลายรายการในตารางด้านล่าง
                  </Typography.Text>
                ) : scope1Category === SCOPE1_NONE ? (
                  <Alert
                    type="info"
                    showIcon
                    className="!mb-0"
                    message="ไม่มีกิจกรรมใน Scope 1"
                    description="คุณเลือกว่าไม่มีกิจกรรมในขอบเขตนี้ — สามารถกดถัดไปได้โดยไม่ต้องกรอกข้อ 2"
                  />
                ) : (
                  <>
                    <div className="mb-4 rounded-lg bg-slate-50/90 px-4 py-2.5 text-sm text-slate-700 sm:px-5">
                      <span className="font-medium text-teal-800">หมวดที่เลือก: </span>
                      {SCOPE1_MAIN_CATEGORIES.find((x) => x.value === scope1Category)?.label ?? scope1Category}
                    </div>
                  </>
                )}
                {scope1Category && scope1Category !== SCOPE1_NONE ? (
                <div className="pb-2">
                  <Alert title="(MxL = Max Load)" type="info" showIcon className="!mb-0" />
                </div>
                ) : null}
                <div id="data1" className="scroll-mt-24">
                  {scope1Category && scope1Category !== SCOPE1_NONE ? (
                    <Form.List
                      name="scope1_entries"
                      rules={[
                        {
                          validator: async (_, value) => {
                            if (!value || !Array.isArray(value) || value.length < 1) {
                              return Promise.reject(new Error("เพิ่มอย่างน้อย 1 รายการ"))
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                    >
                      {(fields, { add, remove }) => (
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
                            >
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <Typography.Text className="text-sm font-semibold text-slate-800">
                                  รายการที่ {index + 1}
                                </Typography.Text>
                                {fields.length > 1 ? (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => remove(field.name)}
                                  >
                                    ลบแถว
                                  </Button>
                                ) : null}
                              </div>
                              {scope1Category === "on_road" ? (
                                <Row gutter={[16, 0]}>
                                  <Col xs={24} md={12}>
                                    <Form.Item
                                      name={[field.name, "entry_mode"]}
                                      label="รูปแบบการกรอก"
                                      rules={[{ required: true, message: "เลือกรูปแบบ" }]}
                                    >
                                      <Select
                                        placeholder="เลือก"
                                        options={SCOPE1_ONROAD_MODES.map((m) => ({
                                          value: m.value,
                                          label: m.label,
                                        }))}
                                        onChange={(nextMode: Scope1OnRoadMode) => {
                                          form.setFields([
                                            { name: ["scope1_entries", field.name, "activity_key"], value: undefined },
                                            { name: ["scope1_entries", field.name, "quantity"], value: undefined },
                                            { name: ["scope1_entries", field.name, "unit"], value: undefined },
                                            { name: ["scope1_entries", field.name, "condition"], value: undefined },
                                            { name: ["scope1_entries", field.name, "vehicle_distance"], value: undefined },
                                            { name: ["scope1_entries", field.name, "vehicle_wheels"], value: undefined },
                                            { name: ["scope1_entries", field.name, "vehicle_mxl"], value: undefined },
                                            { name: ["scope1_entries", field.name, "vehicle_load"], value: undefined },
                                          ])
                                          if (nextMode === "vehicle_based") {
                                            form.setFieldValue(
                                              ["scope1_entries", field.name, "vehicle_distance_unit"],
                                              "km",
                                            )
                                          }
                                        }}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Form.Item noStyle dependencies={[["scope1_entries", field.name, "entry_mode"]]}>
                                    {() => {
                                      const mode = form.getFieldValue([
                                        "scope1_entries",
                                        field.name,
                                        "entry_mode",
                                      ]) as Scope1OnRoadMode | undefined
                                      const activityOpts =
                                        mode === "vehicle_based"
                                          ? SCOPE1_ONROAD_VEHICLE_TYPES.map((v) => ({
                                              value: v.value,
                                              label: v.label,
                                            }))
                                          : (scope1FuelsByCategory.on_road ?? []).map((f) => ({
                                              value: f.value,
                                              label: f.label,
                                            }))
                                      const activityLabel =
                                        mode === "vehicle_based" ? "ประเภทรถ" : "เชื้อเพลิง / ประเภทกิจกรรม"
                                      return (
                                        <Col xs={24} md={12}>
                                          <Form.Item
                                            name={[field.name, "activity_key"]}
                                            label={activityLabel}
                                            rules={[{ required: true, message: "เลือกรายการ" }]}
                                          >
                                            <Select
                                              showSearch
                                              optionFilterProp="label"
                                              placeholder="เลือก"
                                              options={activityOpts}
                                              disabled={!mode}
                                              onChange={() => {
                                                form.setFieldValue(["scope1_entries", field.name, "unit"], undefined)
                                              }}
                                            />
                                          </Form.Item>
                                        </Col>
                                      )
                                    }}
                                  </Form.Item>
                                  <Form.Item noStyle dependencies={[["scope1_entries", field.name, "entry_mode"]]}>
                                    {() => {
                                      const mode = form.getFieldValue([
                                        "scope1_entries",
                                        field.name,
                                        "entry_mode",
                                      ]) as Scope1OnRoadMode | undefined
                                      if (mode !== "vehicle_based") return null
                                      return (
                                        <Col xs={24}>
                                          <Form.Item
                                            name={[field.name, "condition"]}
                                            label="ประเภทตัวกรองการวิ่ง"
                                            rules={[{ required: true, message: "เลือกประเภทตัวกรองการวิ่ง" }]}
                                          >
                                            <Radio.Group className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-4">
                                              {SCOPE1_CONDITION_OPTIONS.map((c) => (
                                                <Radio key={c.value} value={c.value} className="!mr-0">
                                                  {c.label}
                                                </Radio>
                                              ))}
                                            </Radio.Group>
                                          </Form.Item>
                                        </Col>
                                      )
                                    }}
                                  </Form.Item>
                                  <Form.Item noStyle dependencies={[["scope1_entries", field.name, "entry_mode"]]}>
                                    {() => {
                                      const mode = form.getFieldValue([
                                        "scope1_entries",
                                        field.name,
                                        "entry_mode",
                                      ]) as Scope1OnRoadMode | undefined
                                      if (mode !== "vehicle_based") return null
                                      return (
                                        <>
                                          <Col xs={24} sm={14} md={14}>
                                            <Form.Item
                                              name={[field.name, "vehicle_distance"]}
                                              label="ระยะทาง"
                                              rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}
                                            >
                                              <InputNumber min={0} className="!w-full" placeholder="เช่น 120" />
                                            </Form.Item>
                                          </Col>
                                          <Col xs={24} sm={10} md={10}>
                                            <Form.Item
                                              name={[field.name, "vehicle_distance_unit"]}
                                              label="หน่วยระยะทาง"
                                              rules={[{ required: true, message: "เลือกหน่วยระยะทาง" }]}
                                            >
                                              <Select
                                                placeholder="เลือกหน่วย"
                                                options={SCOPE1_VEHICLE_DISTANCE_UNIT_OPTIONS.map((u) => ({
                                                  value: u.value,
                                                  label: u.label,
                                                }))}
                                              />
                                            </Form.Item>
                                          </Col>
                                          <Col xs={24} md={12}>
                                            <Form.Item
                                              name={[field.name, "vehicle_wheels"]}
                                              label="รถคันนั้นมีกี่ล้อ"
                                              rules={[...SCOPE1_WHEELS_RULES]}
                                            >
                                              <InputNumber min={2} step={1} className="!w-full" placeholder="เช่น 6" />
                                            </Form.Item>
                                          </Col>
                                          <Col xs={24} md={12}>
                                            <Form.Item
                                              name={[field.name, "vehicle_mxl"]}
                                              label="MxL เท่าไหร่"
                                              rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}
                                            >
                                              <InputNumber min={0} className="!w-full" placeholder="เช่น 75" />
                                            </Form.Item>
                                          </Col>
                                          <Col xs={24} md={12}>
                                            <Form.Item
                                              name={[field.name, "vehicle_load"]}
                                              label="Load (กี่ % ของภาระ / ความจุ)"
                                              tooltip="กรอกเป็นค่าเปอร์เซ็นต์ 0–100"
                                              rules={[...SCOPE1_LOAD_PERCENT_RULES]}
                                            >
                                              <InputNumber
                                                min={0}
                                                max={100}
                                                className="!w-full max-w-md"
                                                placeholder="เช่น 75"
                                                addonAfter="%"
                                              />
                                            </Form.Item>
                                          </Col>
                                        </>
                                      )
                                    }}
                                  </Form.Item>
                                </Row>
                              ) : null}

                              {scope1Category === "stationary_combustion" ? (
                                <Row gutter={[16, 0]}>
                                  <Col xs={24} md={14}>
                                    <Form.Item
                                      name={[field.name, "activity_key"]}
                                      label="เชื้อเพลิง / แหล่งพลังงาน"
                                      rules={[{ required: true, message: "เลือกเชื้อเพลิง" }]}
                                    >
                                      <Select
                                        showSearch
                                        optionFilterProp="label"
                                        placeholder="เลือก"
                                        options={(scope1FuelsByCategory.stationary_combustion ?? []).map((f) => ({
                                          value: f.value,
                                          label: f.label,
                                        }))}
                                        onChange={() => {
                                          form.setFieldValue(["scope1_entries", field.name, "unit"], undefined)
                                        }}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              ) : null}

                              {scope1Category === "off_road" ? (
                                <Row gutter={[16, 0]}>
                                  <Col xs={24} md={12}>
                                    <Form.Item
                                      name={[field.name, "activity_key"]}
                                      label="เชื้อเพลิง"
                                      rules={[{ required: true, message: "เลือกเชื้อเพลิง" }]}
                                    >
                                      <Select
                                        placeholder="เลือก"
                                        options={(scope1FuelsByCategory.off_road ?? []).map((f) => ({
                                          value: f.value,
                                          label: f.label,
                                        }))}
                                        onChange={() => {
                                          form.setFieldValue(["scope1_entries", field.name, "unit"], undefined)
                                        }}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col xs={24} md={12}>
                                    <Form.Item
                                      name={[field.name, "sector"]}
                                      label="ภาคกิจกรรม"
                                      rules={[{ required: true, message: "เลือกภาคกิจกรรม" }]}
                                    >
                                      <Select
                                        placeholder="เลือก"
                                        options={SCOPE1_SECTOR_OPTIONS.map((s) => ({
                                          value: s.value,
                                          label: s.label,
                                        }))}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              ) : null}

                              <Row gutter={[16, 0]} className="mt-1">
                                <Form.Item
                                  noStyle
                                  dependencies={[
                                    ["scope1_entries", field.name, "activity_key"],
                                    ["scope1_entries", field.name, "entry_mode"],
                                  ]}
                                >
                                  {() => {
                                    const activityKey = form.getFieldValue([
                                      "scope1_entries",
                                      field.name,
                                      "activity_key",
                                    ]) as string | undefined
                                    const mode = form.getFieldValue([
                                      "scope1_entries",
                                      field.name,
                                      "entry_mode",
                                    ]) as Scope1OnRoadMode | undefined
                                    const unitOpts =
                                      scope1Category && activityKey
                                        ? getScope1ActivityUnitOptions(scope1Category, activityKey, mode, scope1FuelsByCategory)
                                        : []
                                    const activityLabel = getScope1ActivityLabel(
                                      scope1Category!,
                                      activityKey,
                                      mode,
                                      scope1FuelsByCategory,
                                    )
                                    const hideQuantityUnit =
                                      scope1Category === "on_road" && mode === "vehicle_based"
                                    return (
                                      <>
                                        <Col xs={24}>
                                          {activityLabel && !hideQuantityUnit ? (
                                            <Typography.Text type="secondary" className="mb-2 block text-xs">
                                              รายการ: {activityLabel}
                                            </Typography.Text>
                                          ) : null}
                                          {activityLabel && hideQuantityUnit ? (
                                            <Typography.Text type="secondary" className="mb-2 block text-xs">
                                              รายการ: {activityLabel}{" "}
                                              <span className="text-slate-400">
                                                (กรอกระยะทาง / ล้อ / MxL / Load ด้านบน — ไม่มีช่องปริมาณเชื้อเพลิง)
                                              </span>
                                            </Typography.Text>
                                          ) : null}
                                        </Col>
                                        {!hideQuantityUnit ? (
                                          <>
                                            <Col xs={24} sm={8} md={8}>
                                              <Form.Item
                                                name={[field.name, "quantity"]}
                                                label="ปริมาณ"
                                                rules={[...SCOPE1_NUMERIC_AMOUNT_RULES]}
                                                tooltip="กรอกเป็นตัวเลข (ทศนิยมได้)"
                                              >
                                                <InputNumber min={0} className="!w-full" placeholder="ตัวเลข" />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={8} md={8}>
                                              <Form.Item
                                                name={[field.name, "unit"]}
                                                label="หน่วย"
                                                rules={[{ required: true, message: "เลือกหน่วย" }]}
                                              >
                                                <Select
                                                  placeholder="หน่วย"
                                                  disabled={!activityKey || unitOpts.length === 0}
                                                  options={unitOpts}
                                                  allowClear={unitOpts.length > 1}
                                                />
                                              </Form.Item>
                                            </Col>
                                            <Col xs={24} sm={8} md={8}>
                                              <Form.Item name={[field.name, "note"]} label="หมายเหตุ (ไม่บังคับ)">
                                                <Input placeholder="เช่น แหล่งใช้ / ช่วงเวลา" />
                                              </Form.Item>
                                            </Col>
                                          </>
                                        ) : (
                                          <Col xs={24}>
                                            <Form.Item name={[field.name, "note"]} label="หมายเหตุ (ไม่บังคับ)">
                                              <Input placeholder="เช่น ทะเบียนรถ / เส้นทาง / ช่วงเวลา" />
                                            </Form.Item>
                                          </Col>
                                        )}
                                      </>
                                    )
                                  }}
                                </Form.Item>
                              </Row>
                            </div>
                          ))}
                          <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() =>
                              add(
                                scope1Category === "on_road"
                                  ? { entry_mode: "fuel_based" as Scope1OnRoadMode }
                                  : {},
                              )
                            }
                            className="!h-11"
                          >
                            เพิ่มรายการ
                          </Button>
                        </div>
                      )}
                    </Form.List>
                  ) : null}
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
                    onChange={(e) => {
                      const v = e.target.value as Scope2EnergyTypeValue
                      form.setFieldsValue({
                        scope2_batches: [],
                        scope2_extra_note: undefined,
                      })
                      setScope2DataMeta({ lines: [] })
                      setS2RefrigLineMetaByKey({})
                      setS2RefrigLineLoadingByKey({})
                      if (v === SCOPE2_NONE) return
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

              <SectionBlock step="2" title="กรอกข้อมูลตามประเภทที่เลือก" sectionId="scope2-section-2">
                <div id="data1" className="scroll-mt-24">
                  {!scope2EnergyType ? (
                    <Typography.Text type="secondary" className="block py-6 text-center text-sm">
                      เลือกประเภทพลังงานในข้อ 1 เพื่อโหลดรายการจากระบบ
                    </Typography.Text>
                  ) : scope2EnergyType === SCOPE2_NONE ? (
                    <Alert
                      type="info"
                      showIcon
                      message="ไม่มีกิจกรรมใน Scope 2"
                      description="คุณเลือกว่าไม่มีกิจกรรมในขอบเขตนี้ — สามารถกดถัดไปได้โดยไม่ต้องกรอกข้อ 2"
                    />
                  ) : (
                  <Spin
                    spinning={
                      scope2EnergyType === "electricity"
                        ? scope2DataLoading
                        : scope2EnergyType === "refrigerants" &&
                          Object.values(s2RefrigLineLoadingByKey).some(Boolean)
                    }
                    tip="กำลังโหลดข้อมูลจาก getData…"
                  >
                      <div className="space-y-4 pt-1">
                        {scope2EnergyType === "electricity" ? (
                          <div className="pb-2">
                            <Alert
                              className="!mb-0"
                              type="info"
                              showIcon
                              message="ไฟฟ้าแบบ grid mix ปี 2016–2018; LCIA method IPCC 2013 GWP 100a V1.03"
                            />
                          </div>
                        ) : null}
                        {scope2EnergyType === "refrigerants" ? (
                          <Typography.Paragraph type="secondary" className="!mb-0 !text-xs !leading-relaxed">
                            
                          </Typography.Paragraph>
                        ) : null}
                        {scope2EnergyType === "electricity" && scope2DataMeta.usageHint ? (
                          <Typography.Paragraph type="secondary" className="!mb-0 !text-xs !leading-relaxed">
                            {scope2DataMeta.usageHint}
                          </Typography.Paragraph>
                        ) : null}
                        {scope2EnergyType === "electricity" || scope2EnergyType === "refrigerants" ? (
                          <Form.List
                            name="scope2_batches"
                            rules={[
                              {
                                validator: async (_, value) => {
                                  if (!value || !Array.isArray(value) || value.length < 1) {
                                    return Promise.reject(new Error("เพิ่มอย่างน้อย 1 รายการ"))
                                  }
                                  return Promise.resolve()
                                },
                              },
                            ]}
                          >
                            {(batchFields, { add, remove }) => {
                              if (scope2EnergyType === "electricity") {
                                if (scope2DataLoading && batchFields.length === 0) {
                                  return (
                                    <Typography.Text type="secondary" className="block py-8 text-center text-sm">
                                      กำลังเตรียมรายการ…
                                    </Typography.Text>
                                  )
                                }
                                if (!scope2DataLoading && scope2DataMeta.lines.length === 0) {
                                  return (
                                    <Typography.Text type="secondary" className="block py-8 text-center text-sm">
                                      ไม่มีรายการจากระบบ
                                    </Typography.Text>
                                  )
                                }
                              }
                              return (
                                <div className="space-y-4">
                                  {batchFields.map((batchField, batchIndex) => {
                                    const lineDefsForBatch =
                                      scope2EnergyType === "electricity"
                                        ? scope2DataMeta.lines
                                        : (s2RefrigLineMetaByKey[batchField.key] ?? [])
                                    return (
                                      <div
                                        key={batchField.key}
                                        className="overflow-hidden rounded-xl border border-slate-200/90 bg-white"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5">
                                          <Typography.Text className="text-sm font-semibold text-slate-800">
                                            รายการที่ {batchIndex + 1}
                                          </Typography.Text>
                                          {batchFields.length > 1 ? (
                                            <Button
                                              type="text"
                                              danger
                                              size="small"
                                              icon={<DeleteOutlined />}
                                              onClick={() => {
                                                setS2RefrigLineMetaByKey((prev) => {
                                                  const next = { ...prev }
                                                  delete next[batchField.key]
                                                  return next
                                                })
                                                setS2RefrigLineLoadingByKey((prev) => {
                                                  const next = { ...prev }
                                                  delete next[batchField.key]
                                                  return next
                                                })
                                                remove(batchField.name)
                                              }}
                                            >
                                              ลบรายการ
                                            </Button>
                                          ) : null}
                                        </div>
                                        {scope2EnergyType === "refrigerants" ? (
                                          <div className="border-b border-slate-100/90 px-4 py-3">
                                            <Form.Item
                                              name={[batchField.name, "ref_type"]}
                                              label="ประเภทสารทำความเย็น"
                                              rules={[{ required: true, message: "เลือกประเภทสาร" }]}
                                              className="!mb-0"
                                            >
                                              <Select
                                                allowClear
                                                placeholder="เลือกประเภทสารในรายการนี้"
                                                options={refrigerantOptions.map((r) => ({
                                                  value: r.value,
                                                  label: r.label,
                                                }))}
                                                onChange={(v) => {
                                                  if (v == null || v === "") {
                                                    clearRefrigerantBatchLines(batchField.name, batchField.key)
                                                    return
                                                  }
                                                  void hydrateRefrigerantBatch(batchField.name, batchField.key, v)
                                                }}
                                              />
                                            </Form.Item>
                                          </div>
                                        ) : null}
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
                                        <Spin
                                          spinning={
                                            scope2EnergyType === "refrigerants" &&
                                            Boolean(s2RefrigLineLoadingByKey[batchField.key])
                                          }
                                        >
                                          <Form.List name={[batchField.name, "lines"]}>
                                            {(lineFields) =>
                                              lineFields.length === 0 ? (
                                                <Typography.Text
                                                  type="secondary"
                                                  className="block px-4 py-8 text-center text-sm"
                                                >
                                                  {scope2EnergyType === "refrigerants"
                                                    ? s2RefrigLineLoadingByKey[batchField.key]
                                                      ? "กำลังโหลดรายการ…"
                                                      : "เลือกประเภทสารทำความเย็นในรายการนี้ก่อน — จากนั้นระบบจะแสดงช่องกรอกปริมาณ"
                                                    : scope2DataLoading
                                                      ? "กำลังเตรียมรายการ…"
                                                      : "ไม่มีรายการในรายการนี้"}
                                                </Typography.Text>
                                              ) : (
                                                lineFields.map((lineField, index) => {
                                                  const lineDef = lineDefsForBatch[index]
                                                  return (
                                                    <Row
                                                      key={lineField.key}
                                                      gutter={[16, 12]}
                                                      className="border-b border-slate-100/90 px-4 py-4 last:border-b-0"
                                                      align="top"
                                                    >
                                                      <Col xs={24} md={11}>
                                                        <Typography.Text className="block text-sm leading-relaxed text-slate-800">
                                                          {lineDef?.label ?? "—"}
                                                        </Typography.Text>
                                                        <Form.Item name={[lineField.name, "lineId"]} hidden>
                                                          <Input />
                                                        </Form.Item>
                                                      </Col>
                                                      <Col xs={12} md={7}>
                                                        <Form.Item
                                                          name={[lineField.name, "quantity"]}
                                                          rules={[{ required: true, message: "กรอกปริมาณ" }]}
                                                          className="!mb-0"
                                                        >
                                                          <InputNumber
                                                            min={0}
                                                            className="!w-full"
                                                            placeholder="กรอกปริมาณ"
                                                          />
                                                        </Form.Item>
                                                      </Col>
                                                      <Col xs={12} md={6}>
                                                        <Form.Item
                                                          name={[lineField.name, "unit"]}
                                                          rules={[{ required: true, message: "เลือกหน่วย" }]}
                                                          className="!mb-0"
                                                        >
                                                          <Select
                                                            placeholder="หน่วย"
                                                            allowClear={
                                                              lineDef ? lineDef.unitOptions.length > 1 : false
                                                            }
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
                                        </Spin>
                                      </div>
                                    )
                                  })}
                                  <Button
                                    type="dashed"
                                    block
                                    icon={<PlusOutlined />}
                                    disabled={
                                      scope2EnergyType === "electricity" &&
                                      (scope2DataLoading || scope2DataMeta.lines.length === 0)
                                    }
                                    onClick={() =>
                                      add(
                                        scope2EnergyType === "electricity"
                                          ? { lines: buildScope2LinesFormState(scope2DataMeta) }
                                          : { ref_type: undefined, lines: [] },
                                      )
                                    }
                                    className="!h-11"
                                  >
                                    เพิ่มรายการ
                                  </Button>
                                </div>
                              )
                            }}
                          </Form.List>
                        ) : null}
                      </div>
                  </Spin>
                  )}
                </div>
              </SectionBlock>

            </div>
          )}

          {mainStep === 3 && (
            <div className="space-y-0">
              {hasMaterialTopics ? (
                <div className="mb-6 pl-5 pr-3 sm:pl-7 sm:pr-4 md:pl-10 md:pr-6">
                  <MaterialTopicScope3Alert items={materialTopicSummaries} showNextHint />
                </div>
              ) : null}
              <SectionBlock step="1" title="เลือกหมวดกิจกรรมเพื่อประเมิน (1–15)">
                <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                  <div className="border-b border-slate-200/80 bg-slate-50/95 px-4 py-4 md:px-6 md:py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0">
                        <Typography.Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
                          ความคืบหน้ารายหมวดกิจกรรม
                        </Typography.Text>
                        <Typography.Title level={5} className="!mb-0 !mt-1.5 !text-base !font-semibold text-slate-900 md:!text-lg">
                          หมวดที่ {s3AssessmentNav.idx + 1} จาก {s3AssessmentNav.n}
                        </Typography.Title>
                        <Typography.Text className="mt-1 block text-sm font-medium leading-snug text-slate-700">
                          {s3AssessmentNav.category.title}
                        </Typography.Text>
                      </div>
                      <div className="w-full min-w-0 lg:max-w-md lg:shrink-0">
                        <Progress
                          percent={s3AssessmentNav.progress}
                          strokeColor={{ "0%": "#0d9488", "100%": "#047857" }}
                          trailColor="#e2e8f0"
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                      <Button
                        type="default"
                        size="large"
                        icon={<LeftOutlined />}
                        disabled={s3AssessmentNav.idx === 0}
                        onClick={() => setScope3AssessmentCategoryIndex((i) => Math.max(0, i - 1))}
                        className="w-full sm:w-auto sm:justify-self-start"
                      >
                        หมวดก่อนหน้า
                      </Button>
                      <Select
                        size="large"
                        className="!min-h-10 w-full min-w-0 max-w-full sm:max-w-none"
                        value={String(s3AssessmentNav.idx)}
                        onChange={(v) => setScope3AssessmentCategoryIndex(Number.parseInt(String(v), 10))}
                        options={SCOPE3_ASSESSMENT_CATEGORIES.map((c, i) => ({
                          label: `${i + 1}. ${c.title}`,
                          value: String(i),
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
                          setScope3AssessmentCategoryIndex((i) =>
                            Math.min(SCOPE3_ASSESSMENT_CATEGORIES.length - 1, i + 1),
                          )
                        }
                        className="w-full sm:w-auto sm:justify-self-end"
                      >
                        หมวดถัดไป
                      </Button>
                    </div>
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock step="2" title="ตอบแบบประเมินตามเกณฑ์ Material Topic">
                  <Form.Item name={["s3_self_assessments", s3AssessmentNav.idx, "categoryId"]} hidden>
                    <Input />
                  </Form.Item>

                  <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
                    <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={1} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          การมีอยู่ของกิจกรรม{" "}
                          <Typography.Text type="secondary" className="!text-sm !font-normal md:!text-base">
                            (Source of GHG)
                          </Typography.Text>
                        </Typography.Title>
                      </div>
                      <Form.Item
                        name={["s3_self_assessments", s3AssessmentNav.idx, "presence"]}
                        label={
                          <span className="text-sm font-medium text-slate-800 md:text-base">
                            กิจกรรมนี้เกิดขึ้นในองค์กรของคุณหรือไม่?
                          </span>
                        }
                        rules={[{ required: true, message: "เลือกคำตอบ" }]}
                        className="!mb-0"
                      >
                        <Radio.Group className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4 [&_.ant-radio-wrapper]:!mr-0 [&_.ant-radio-wrapper]:!w-full sm:[&_.ant-radio-wrapper]:!min-w-0 sm:[&_.ant-radio-wrapper]:!flex-1">
                          <Radio value="yes" className={S3_SELF_ASSESS_RADIO_ROW}>
                            <span className="block pt-0.5">
                              <span className="font-medium text-slate-800">ใช่</span>
                              <span className="mt-1 block text-sm font-normal leading-relaxed text-slate-500">
                                มีกิจกรรมนี้ในขอบเขตการดำเนินงาน / ห่วงโซ่ที่ประเมิน
                              </span>
                            </span>
                          </Radio>
                          <Radio value="no" className={S3_SELF_ASSESS_RADIO_ROW}>
                            <span className="block pt-0.5">
                              <span className="font-medium text-slate-800">ไม่ใช่</span>
                              <span className="mt-1 block text-sm font-normal leading-relaxed text-slate-500">
                                ไม่มีหรือไม่เกี่ยวข้องกับองค์กรในช่วงรายงาน
                              </span>
                            </span>
                          </Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>

                    <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={2} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          Sector Guidance
                        </Typography.Title>
                      </div>
                      <Form.Item
                        name={["s3_self_assessments", s3AssessmentNav.idx, "sectorGuidance"]}
                        label={
                          <span className="text-sm font-normal leading-relaxed text-slate-800">
                            มีข้อกำหนดเฉพาะในกลุ่มอุตสาหกรรมของคุณที่บังคับให้ต้องรายงานหรือไม่?
                          </span>
                        }
                        colon={false}
                        rules={[{ required: true, message: "เลือกคำตอบ" }]}
                        className="!mb-0"
                      >
                        <Radio.Group className="flex flex-wrap gap-x-8 gap-y-2 pt-1 [&_.ant-radio-wrapper]:!mr-0">
                          <Radio value="yes" className={S3_SELF_ASSESS_RADIO_BOOL}>
                            ใช่
                          </Radio>
                          <Radio value="no" className={S3_SELF_ASSESS_RADIO_BOOL}>
                            ไม่ใช่
                          </Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>

                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const presence = form.getFieldValue([
                          "s3_self_assessments",
                          s3AssessmentNav.idx,
                          "presence",
                        ])
                        if (presence !== "yes") {
                          return (
                            <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                              <Alert
                                type="info"
                                showIcon
                                message="ไม่มีกิจกรรมนี้ — ไม่ต้องประเมิน %GHG / อิทธิพล / ความเสี่ยง / โอกาส"
                                className="!mb-0"
                              />
                            </div>
                          )
                        }
                        return (
                          <>
                    <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={3} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          %GHG{" "}
                          <Typography.Text type="secondary" className="!text-sm !font-normal md:!text-base">
                            (Size)
                          </Typography.Text>
                        </Typography.Title>
                      </div>
                      <Form.Item
                        name={["s3_self_assessments", s3AssessmentNav.idx, "ghgPercent"]}
                        label={
                          <span className="text-sm font-normal leading-relaxed text-slate-800">
                            สัดส่วนการปล่อยก๊าซจากกิจกรรมนี้ต่อภาพรวมองค์กรอยู่ในช่วงใด?
                          </span>
                        }
                        colon={false}
                        rules={[{ required: true, message: "เลือกช่วง %GHG" }]}
                        className="!mb-0"
                      >
                        <Radio.Group className="flex w-full flex-col gap-3 pt-1 [&_.ant-radio-wrapper]:!mr-0 [&_.ant-radio-wrapper]:!w-full">
                          {SCOPE3_GHG_BAND_OPTIONS.map((opt) => (
                            <Radio key={opt.value} value={opt.value} className={S3_SELF_ASSESS_RADIO_ROW}>
                              <span className="block max-w-full pt-0.5">
                                <span className="font-medium text-slate-800 md:text-base">{opt.label}</span>
                                <span className="mt-1.5 block text-sm font-normal leading-relaxed text-slate-500">
                                  {opt.hint}
                                </span>
                              </span>
                            </Radio>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                      <Form.Item noStyle shouldUpdate>
                        {() => {
                          const pct = form.getFieldValue([
                            "s3_self_assessments",
                            s3AssessmentNav.idx,
                            "ghgPercent",
                          ]) as number | undefined
                          if (pct == null) return null
                          return (
                            <Typography.Text type="secondary" className="mt-3 block text-sm">
                              คะแนน %GHG = {ghgPercentToScore(pct)} (ถ่วงน้ำหนัก × 0.60)
                            </Typography.Text>
                          )
                        }}
                      </Form.Item>
                    </div>

                    <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={4} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          ระดับอิทธิพลในการจัดการ{" "}
                          <Typography.Text type="secondary" className="!text-sm !font-normal md:!text-base">
                            (Level of Influence)
                          </Typography.Text>
                        </Typography.Title>
                      </div>
                      <Typography.Paragraph type="secondary" className="!mb-4 !text-sm !leading-relaxed md:!text-[15px]">
                        องค์กรมีศักยภาพในการสั่งการลดการปล่อยในส่วนนี้ — ถ่วงน้ำหนัก × 0.20
                      </Typography.Paragraph>
                      <Form.Item
                        name={["s3_self_assessments", s3AssessmentNav.idx, "influenceLevel"]}
                        rules={[{ required: true, message: "เลือกคะแนน" }]}
                        className="!mb-0"
                      >
                        <Radio.Group className="flex w-full flex-col gap-4 md:gap-5 [&_.ant-radio-wrapper]:!mr-0 [&_.ant-radio-wrapper]:!w-full [&_.ant-radio-wrapper]:!max-w-none">
                          {SCOPE3_INFLUENCE_OPTIONS.map((opt) => (
                            <Radio key={opt.value} value={opt.value} className={S3_SELF_ASSESS_RADIO_ROW}>
                              <span className="block max-w-full pt-0.5">
                                <span className="font-medium text-slate-800 md:text-base">{opt.label}</span>
                                <span className="mt-1.5 block text-sm font-normal leading-relaxed text-slate-500">
                                  {opt.hint}
                                </span>
                              </span>
                            </Radio>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                    </div>

                    <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={5} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          ความเสี่ยง{" "}
                          <Typography.Text type="secondary" className="!text-sm !font-normal md:!text-base">
                            (Risk)
                          </Typography.Text>
                        </Typography.Title>
                      </div>
                      <Typography.Paragraph type="secondary" className="!mb-4 !text-sm !leading-relaxed md:!text-[15px]">
                        ความเสี่ยงต่อชื่อเสียงหรือการปฏิบัติตามกฎหมาย — ถ่วงน้ำหนัก × 0.10
                      </Typography.Paragraph>
                      <Form.Item
                        name={["s3_self_assessments", s3AssessmentNav.idx, "riskLevel"]}
                        rules={[{ required: true, message: "เลือกคะแนน" }]}
                        className="!mb-0"
                      >
                        <Radio.Group className="flex w-full flex-col gap-4 md:gap-5 [&_.ant-radio-wrapper]:!mr-0 [&_.ant-radio-wrapper]:!w-full [&_.ant-radio-wrapper]:!max-w-none">
                          {SCOPE3_RISK_OPTIONS.map((opt) => (
                            <Radio key={`risk-${opt.value}`} value={opt.value} className={S3_SELF_ASSESS_RADIO_ROW}>
                              <span className="block max-w-full pt-0.5">
                                <span className="font-medium text-slate-800 md:text-base">{opt.label}</span>
                                <span className="mt-1.5 block text-sm font-normal leading-relaxed text-slate-500">
                                  {opt.hint}
                                </span>
                              </span>
                            </Radio>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                    </div>

                    <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={6} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          โอกาส{" "}
                          <Typography.Text type="secondary" className="!text-sm !font-normal md:!text-base">
                            (Opportunity)
                          </Typography.Text>
                        </Typography.Title>
                      </div>
                      <Typography.Paragraph type="secondary" className="!mb-4 !text-sm !leading-relaxed md:!text-[15px]">
                        โอกาสทางธุรกิจจากการจัดการกิจกรรมนี้ — ถ่วงน้ำหนัก × 0.10
                      </Typography.Paragraph>
                      <Form.Item
                        name={["s3_self_assessments", s3AssessmentNav.idx, "opportunityLevel"]}
                        rules={[{ required: true, message: "เลือกคะแนน" }]}
                        className="!mb-0"
                      >
                        <Radio.Group className="flex w-full flex-col gap-4 md:gap-5 [&_.ant-radio-wrapper]:!mr-0 [&_.ant-radio-wrapper]:!w-full [&_.ant-radio-wrapper]:!max-w-none">
                          {SCOPE3_OPPORTUNITY_LEVEL_OPTIONS.map((opt) => (
                            <Radio key={`opp-${opt.value}`} value={opt.value} className={S3_SELF_ASSESS_RADIO_ROW}>
                              <span className="block max-w-full pt-0.5">
                                <span className="font-medium text-slate-800 md:text-base">{opt.label}</span>
                                <span className="mt-1.5 block text-sm font-normal leading-relaxed text-slate-500">
                                  {opt.hint}
                                </span>
                              </span>
                            </Radio>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                    </div>

                    {currentMaterialPreview && currentAssessmentRow?.presence === "yes" ? (
                      <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                        <Alert
                          type={currentMaterialPreview.isMaterial ? "success" : "warning"}
                          showIcon
                          message={
                            <span>
                              คะแนนรวม (Total) ={" "}
                              <strong>{formatMaterialTotal(currentMaterialPreview.total)}</strong>
                              {" — "}
                              {currentMaterialPreview.isMaterial
                                ? `เป็น Material Topic (≥ ${MATERIAL_TOPIC_THRESHOLD})`
                                : `ไม่เป็น Material Topic (< ${MATERIAL_TOPIC_THRESHOLD})`}
                            </span>
                          }
                          description={
                            <span className="text-xs">
                              %GHG {currentMaterialPreview.weightedGhg.toFixed(2)} + อิทธิพล{" "}
                              {currentMaterialPreview.weightedInfluence.toFixed(2)} + ความเสี่ยง{" "}
                              {currentMaterialPreview.weightedRisk.toFixed(2)} + โอกาส{" "}
                              {currentMaterialPreview.weightedOpportunity.toFixed(2)}
                            </span>
                          }
                          className="!mb-0"
                        />
                      </div>
                    ) : null}
                          </>
                        )
                      }}
                    </Form.Item>

                    <div className="border-b border-slate-100/90 px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={7} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          Outsourcing / Employee Engagement
                        </Typography.Title>
                      </div>
                      <div className="flex flex-col gap-8">
                        <Form.Item
                          name={["s3_self_assessments", s3AssessmentNav.idx, "outsourcing"]}
                          label={
                            <span className="text-sm font-normal leading-relaxed text-slate-800">
                              <span className="font-medium text-slate-900">Outsourcing</span>
                              {" — "}
                              เป็นกิจกรรมที่เกิดจากการจ้างเหมาช่วง (Outsource) ที่สำคัญต่อธุรกิจหรือไม่?
                            </span>
                          }
                          colon={false}
                          rules={[{ required: true, message: "เลือกคำตอบ" }]}
                          className="!mb-0"
                        >
                          <Radio.Group className="flex flex-wrap gap-x-8 gap-y-2 pt-1 [&_.ant-radio-wrapper]:!mr-0">
                            <Radio value="yes" className={S3_SELF_ASSESS_RADIO_BOOL}>
                              ใช่
                            </Radio>
                            <Radio value="no" className={S3_SELF_ASSESS_RADIO_BOOL}>
                              ไม่ใช่
                            </Radio>
                          </Radio.Group>
                        </Form.Item>
                        <Form.Item
                          name={["s3_self_assessments", s3AssessmentNav.idx, "employeeEngagement"]}
                          label={
                            <span className="text-sm font-normal leading-relaxed text-slate-800">
                              <span className="font-medium text-slate-900">Employee Engagement</span>
                              {" — "}
                              เป็นกิจกรรมที่เกี่ยวข้องกับการสร้างส่วนร่วมของพนักงานอย่างมีนัยสำคัญหรือไม่?
                            </span>
                          }
                          colon={false}
                          rules={[{ required: true, message: "เลือกคำตอบ" }]}
                          className="!mb-0"
                        >
                          <Radio.Group className="flex flex-wrap gap-x-8 gap-y-2 pt-1 [&_.ant-radio-wrapper]:!mr-0">
                            <Radio value="yes" className={S3_SELF_ASSESS_RADIO_BOOL}>
                              ใช่
                            </Radio>
                            <Radio value="no" className={S3_SELF_ASSESS_RADIO_BOOL}>
                              ไม่ใช่
                            </Radio>
                          </Radio.Group>
                        </Form.Item>
                      </div>
                    </div>

                    <div className="px-4 py-5 md:px-7 md:py-6">
                      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <S3QuestionStepBadge n={8} />
                        <Typography.Title
                          level={5}
                          className="!m-0 !text-sm !font-semibold text-slate-800 md:!text-base"
                        >
                          หมายเหตุ{" "}
                          <Typography.Text type="secondary" className="!text-sm !font-normal md:!text-base">
                            (Remark)
                          </Typography.Text>
                        </Typography.Title>
                      </div>
                      <Form.Item
                        name={["s3_self_assessments", s3AssessmentNav.idx, "remark"]}
                        label={
                          <span className="text-sm font-medium text-slate-800">ข้อความเพิ่มเติม</span>
                        }
                        className="!mb-0"
                      >
                        <Input.TextArea
                          rows={5}
                          placeholder="อธิบายเหตุผลประกอบการให้คะแนนข้างต้น (ไม่บังคับ)"
                          className="!resize-y !text-base"
                          showCount
                          maxLength={2000}
                        />
                      </Form.Item>
                    </div>
                  </div>
              </SectionBlock>
            </div>
          )}

          {mainStep === 4 && (
            <div className="space-y-0">
              <MaterialTopicScope3Alert items={materialTopicSummaries} variant="info" />
              <SectionBlock step="1" title="หมวดหมู่กิจกรรมใดบ้างที่เกิดขึ้นในองค์กรของคุณ (เลือกตามข้อที่บริษัทมี)">
                {materialEntryTypes.length === 0 ? (
                  <Alert
                    type="info"
                    showIcon
                    message="ยังไม่มีหมวด Material Topic"
                    description={`กลับไปขั้น «แบบประเมินตนเอง» แล้วประเมินหมวดที่มีกิจกรรม — หมวดที่ได้คะแนนรวม ≥ ${MATERIAL_TOPIC_THRESHOLD} จะแสดงในข้อ 1 นี้`}
                    className="!mb-0"
                  />
                ) : null}
                <Form.Item
                  name="scope3_entry_activity_type"
                  rules={[{ required: materialEntryTypes.length > 0, message: "เลือกประเภทกิจกรรม" }]}
                  className={materialEntryTypes.length === 0 ? "!mb-0 hidden" : "!mb-0"}
                >
                  <Radio.Group
                    className="flex w-full flex-col gap-5 md:gap-6"
                    onChange={() => {
                      form.setFieldsValue({
                        scope3_entry_note: undefined,
                      })
                    }}
                  >
                    {materialEntryTypes.map((c) => (
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

              <SectionBlock step="2" title="กรอกข้อมูลตามหมวดที่เลือก">
                <div id="data1" className="scroll-mt-24">
                  {!scope3EntryActivityType ? (
                    <Typography.Text type="secondary" className="block py-6 text-center text-sm">
                      เลือกหมวดในข้อ 1 เพื่อแสดงฟอร์มกรอกที่สอดคล้องกับหมวดนั้น
                    </Typography.Text>
                  ) : (
                    <div className="space-y-4 pt-1">
                      <Scope3CategoryEntryForm cat={scope3EntryActivityType} />
                      <Form.Item name="scope3_entry_note" label="หมายเหตุ (ไม่บังคับ)" className="!mb-0">
                        <Input.TextArea rows={3} placeholder="รายละเอียดเพิ่มเติมสำหรับหมวดนี้" />
                      </Form.Item>
                    </div>
                  )}
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
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={loadingSave}
                disabled={!canSave}
                onClick={() => void runSave()}
                className="signature-gradient min-w-[120px] border-0"
              >
                บันทึก
              </Button>
            </Space>
          </div>

        </div>
      </section>

      {mainStep === 4 && scope3FilledEntries.length > 0 ? (
        <Scope3EntrySummaryFloat
          items={scope3FilledEntries}
          activeKey={scope3EntryActivityType}
          onSelect={handleScope3CartSelect}
        />
      ) : null}
      </div>
    </div>
  )
}

