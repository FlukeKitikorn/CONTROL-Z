/** ข้อความและข้อมูลตัวอย่างจาก fr_03.2.html — ต่อไปผูก API/model ได้ */

export const FR032_FORM_TITLE =
  "ประเมินความมีนัยสำคัญของการปล่อยก๊าซเรือนกระจกทางอ้อม (SCOPE 3)"

export const FR032_INTRO =
  "องค์กรจะต้องคัดเลือกแหล่งปล่อยก๊าซเรือนกระจกทางอ้อม (Scope 3) โดยกำหนดเกณฑ์ในการประเมินความมีนัยสำคัญของการปล่อยก๊าซเรือนกระจกทางอ้อม (Scope 3)"

export const FR032_CRITERIA_SOURCE =
  "ที่มา : หัวข้อที่ 12 ข้อกำหนดในการคำนวณและรายงานคาร์บอนฟุตพริ้นท์ขององค์กร พิมพ์ครั้งที่ 7 (ฉบับปรับปรุงครั้งที่ 5, มกราคม 2564)"

export const FR032_CRITERIA_NOTE_TITLE = "อธิบาย หลักเกณฑ์ในการประเมินความมีนัยสำคัญ"

export const FR032_SELF_ASSESSMENT_NOTE =
  "องค์กรมีการทำ Self-Assessment โดยถ้าผลการประเมิน มากกว่าหรือเท่ากับ 3 คะแนน จะนับเป็นแหล่งปล่อยที่มีนัยสำคัญ นับรวมในขอบเขตการประเมิน"

export type Fr032CriterionRow = {
  key: string
  term: string
  description: string
}

export const FR032_CRITERIA_ROWS: readonly Fr032CriterionRow[] = [
  {
    key: "source",
    term: "Source of GHG",
    description: "องค์กรมีแหล่งปล่อยก๊าซเรือนกระจกนี้หรือไม่",
  },
  {
    key: "magnitude",
    term: "ขนาด (Magnitude or Size)",
    description:
      "เป็นกิจกรรมการปล่อยหรือดูดกลับก๊าซเรือนกระจกทางอ้อมซึ่งถูกสันนิษฐานว่ามีปริมาณการปล่อยหรือดูดกลับก๊าซเรือนกระจกในปริมาณมากอย่างมีนัยสำคัญ",
  },
  {
    key: "influence",
    term: "ระดับของแรงจูงใจ (Level of influence (Reduction of potential))",
    description:
      "เป็นกิจกรรมการปล่อยหรือดูดกลับก๊าซเรือนกระจกที่องค์กรมีความสามารถในการตรวจติดตามและลดปริมาณการปล่อยหรือดูดกลับก๊าซเรือนกระจกจากกิจกรรมนั้น(ตัวอย่างเช่นเป็นกิจกรรมที่เกี่ยวข้องกับการประเมินประสิทธิภาพพลังงาน การออกแบบเชิงนิเวศเศรษฐกิจ, เกี่ยวข้องกับข้อตกลงที่มีกับลูกค้า, เกี่ยวข้องกับข้อกำหนดขอบเขตงานจากผู้ว่าจ้าง)",
  },
  {
    key: "risk",
    term: "ความเสี่ยง หรือ โอกาส Risk or opportunity",
    description:
      "เป็นกิจกรรมการปล่อยหรือดูดกลับก๊าซเรือนกระจกทางอ้อมซึ่งมีส่วนทำให้องค์กรได้รับความเสี่ยง (ตัวอย่างของความเสี่ยงที่มีความเชื่อมโยงกับการเปลี่ยนแปลงสภาพภูมิอากาศ เช่น ความเสี่ยงทางด้านการเงิน, ความเสี่ยงทางด้านกฎระเบียบข้อบังคับ, ความเสี่ยงตลอดห่วงโซ่อุปทาน, ความเสี่ยงเกี่ยวกับสินค้าและลูกค้า, ความเสี่ยงเกี่ยวกับการดำเนินคดี และ ความเสี่ยงด้านชื่อเสียง) หรือได้รับโอกาสต่างๆ ทางธุรกิจ (เช่น การเข้าสู่ช่องทางตลาดใหม่ การเข้าสู่ระบบธุรกิจในรูปแบบใหม่)",
  },
  {
    key: "sector",
    term: "Sector Guidance",
    description:
      "เป็นกิจกรรมการปล่อยก๊าซเรือนกระจกที่ถูกถือว่ามีนัยสำคัญสำหรับอุตสาหกรรมที่กำลังพิจารณา ตามที่กำหนดไว้ในคู่มือหรือแนวทางที่เฉพาะเจาะจงสำหรับอุตสาหกรรมนั้น",
  },
  {
    key: "outsourcing",
    term: "Outsourcing",
    description:
      "เป็นกิจกรรมการปล่อยและดูดกลับก๊าซเรือนกระจกทางอ้อมที่เกิดจากการจัดจ้างบุคคลหรือหน่วยงานภายนอกเข้ามาดำเนินกิจกรรมที่ถือว่า เป็นกิจกรรมหลักในการดำเนินธุรกิจขององค์กร",
  },
  {
    key: "employee",
    term: "Employee engagement",
    description:
      "เป็นกิจกรรมการปล่อยก๊าซเรือนกระจกทางอ้อมที่สามารถส่งเสริมให้เกิดการกระตุ้นให้พนักงานมีส่วนร่วมในการลดการปล่อยก๊าซเรือนกระจก ผ่านการลดการใช้พลังงาน หรือการทำงานร่วมกันเป็นทีมภายใต้หลักคิดที่เกี่ยวข้องกับการเปลี่ยนแปลงสภาพภูมิอากาศ (เช่น การสร้างแรงจูงใจในการอนุรักษ์พลังงาน, การเดินทาง โดยใช้รถร่วมกัน, การประเมินราคาคาร์บอนภายในองค์กร เป็นต้น)",
  },
] as const

export type Fr032CategoryAssessmentRow = {
  key: string
  no: number
  category: string
  sourceOfGhg: string
  magnitude: string
  levelOfInfluence: string
  riskOrOpportunity: string
  sectorGuidance: string
  outsourcing: string
  employeeEngagement: string
  remark: string
}

/** ตัวอย่างจาก fr_03.2.html — ช่องว่าง = "" */
export const FR032_DEFAULT_CATEGORY_ROWS: readonly Fr032CategoryAssessmentRow[] = [
  {
    key: "1",
    no: 1,
    category: "Purchased goods and services",
    sourceOfGhg: "P",
    magnitude: "5",
    levelOfInfluence: "1",
    riskOrOpportunity: "1",
    sectorGuidance: "ü",
    outsourcing: "P",
    employeeEngagement: "P",
    remark: "",
  },
  {
    key: "2",
    no: 2,
    category: "Capital goods",
    sourceOfGhg: "P",
    magnitude: "1",
    levelOfInfluence: "3",
    riskOrOpportunity: "1",
    sectorGuidance: "ü",
    outsourcing: "P",
    employeeEngagement: "P",
    remark: "",
  },
  {
    key: "3",
    no: 3,
    category: "Fuel- and energy related activities",
    sourceOfGhg: "P",
    magnitude: "3",
    levelOfInfluence: "1",
    riskOrOpportunity: "5",
    sectorGuidance: "ü",
    outsourcing: "P",
    employeeEngagement: "P",
    remark: "",
  },
  {
    key: "4",
    no: 4,
    category: "Upstream transportation and distribution",
    sourceOfGhg: "P",
    magnitude: "1",
    levelOfInfluence: "1",
    riskOrOpportunity: "3",
    sectorGuidance: "O",
    outsourcing: "O",
    employeeEngagement: "P",
    remark: "",
  },
  {
    key: "5",
    no: 5,
    category: "Waste generated in operations",
    sourceOfGhg: "P",
    magnitude: "1",
    levelOfInfluence: "1",
    riskOrOpportunity: "1",
    sectorGuidance: "O",
    outsourcing: "O",
    employeeEngagement: "P",
    remark: "",
  },
  {
    key: "6",
    no: 6,
    category: "Business travel",
    sourceOfGhg: "P",
    magnitude: "1",
    levelOfInfluence: "1",
    riskOrOpportunity: "1",
    sectorGuidance: "ü",
    outsourcing: "P",
    employeeEngagement: "O",
    remark: "",
  },
  {
    key: "7",
    no: 7,
    category: "Employee commuting",
    sourceOfGhg: "P",
    magnitude: "1",
    levelOfInfluence: "5",
    riskOrOpportunity: "1",
    sectorGuidance: "ü",
    outsourcing: "P",
    employeeEngagement: "O",
    remark: "พนักงานมาทำงานโดยรถรับส่งของบริษัท",
  },
  {
    key: "8",
    no: 8,
    category: "Upstream leased assets",
    sourceOfGhg: "O",
    magnitude: "",
    levelOfInfluence: "",
    riskOrOpportunity: "",
    sectorGuidance: "",
    outsourcing: "",
    employeeEngagement: "",
    remark: "",
  },
  {
    key: "9",
    no: 9,
    category: "Downstream transportation and distribution",
    sourceOfGhg: "P",
    magnitude: "1",
    levelOfInfluence: "1",
    riskOrOpportunity: "1",
    sectorGuidance: "ü",
    outsourcing: "P",
    employeeEngagement: "P",
    remark: "",
  },
  {
    key: "10",
    no: 10,
    category: "Processing of sold products",
    sourceOfGhg: "O",
    magnitude: "",
    levelOfInfluence: "",
    riskOrOpportunity: "",
    sectorGuidance: "",
    outsourcing: "",
    employeeEngagement: "",
    remark: "",
  },
  {
    key: "11",
    no: 11,
    category: "Use of sold products",
    sourceOfGhg: "O",
    magnitude: "",
    levelOfInfluence: "",
    riskOrOpportunity: "",
    sectorGuidance: "",
    outsourcing: "",
    employeeEngagement: "",
    remark: "",
  },
  {
    key: "12",
    no: 12,
    category: "End-of-life treatment of sold products",
    sourceOfGhg: "P",
    magnitude: "1",
    levelOfInfluence: "1",
    riskOrOpportunity: "1",
    sectorGuidance: "ü",
    outsourcing: "P",
    employeeEngagement: "P",
    remark: "",
  },
  {
    key: "13",
    no: 13,
    category: "Downstream leased assets",
    sourceOfGhg: "O",
    magnitude: "",
    levelOfInfluence: "",
    riskOrOpportunity: "",
    sectorGuidance: "",
    outsourcing: "",
    employeeEngagement: "",
    remark: "",
  },
  {
    key: "14",
    no: 14,
    category: "Franchises",
    sourceOfGhg: "O",
    magnitude: "",
    levelOfInfluence: "",
    riskOrOpportunity: "",
    sectorGuidance: "",
    outsourcing: "",
    employeeEngagement: "",
    remark: "",
  },
  {
    key: "15",
    no: 15,
    category: "Investments",
    sourceOfGhg: "O",
    magnitude: "",
    levelOfInfluence: "",
    riskOrOpportunity: "",
    sectorGuidance: "",
    outsourcing: "",
    employeeEngagement: "",
    remark: "",
  },
] as const
