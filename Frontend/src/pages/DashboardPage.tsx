import { Button } from "antd"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { Panel } from "@/components/dashboard/Panel"

export function DashboardPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline mb-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            ศูนย์บัญชาการความยั่งยืน
          </h1>
          <p className="max-w-2xl text-base text-slate-600 md:text-lg">
            ติดตามการปล่อยก๊าซ แผนลดปริมาณ และความพร้อมในการรายงานในที่เดียว
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="large" style={{ borderRadius: 999, height: 42, fontWeight: 600 }}>
            อัปโหลดข้อมูลกิจกรรม
          </Button>
          <Button
            type="primary"
            size="large"
            className="signature-gradient border-none"
            style={{ borderRadius: 999, height: 42, fontWeight: 700 }}
          >
            รันคำนวณคาร์บอน
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="การปล่อยรวม"
          value="12,482 tCO2e"
          helper="+4.2% เทียบเดือนก่อน"
          trend="up"
        />
        <MetricCard
          label="ลดลงจากปีฐาน"
          value="-18.4%"
          helper="อยู่ในแผนเป้าหมายปี 2030"
          trend="down"
        />
        <MetricCard
          label="ความครบถ้วนข้อมูล"
          value="82%"
          helper="เหลือ 6 แหล่งรอตรวจสอบ"
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Panel title="แนวโน้มการปล่อย" actionText="ดูรายละเอียด">
            <div className="flex h-64 items-end justify-between gap-3 px-2">
              {[
                { year: "ม.ค.", h: "h-[40%]" },
                { year: "ก.พ.", h: "h-[46%]" },
                { year: "มี.ค.", h: "h-[52%]" },
                { year: "เม.ย.", h: "h-[49%]" },
                { year: "พ.ค.", h: "h-[44%]" },
                { year: "มิ.ย.", h: "h-[38%]" },
              ].map((bar, idx) => (
                <div key={bar.year} className="flex w-full flex-col items-center gap-2">
                  <div className={`${idx === 2 ? "bg-emerald-700" : "bg-emerald-100"} w-full rounded-t-md ${bar.h}`} />
                  <span className="text-xs font-medium text-slate-500">{bar.year}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-4">
          <Panel title="สัดส่วนตาม Scope">
            <div className="space-y-4">
              {[
                { label: "Scope 1", percent: 12 },
                { label: "Scope 2", percent: 24 },
                { label: "Scope 3", percent: 64 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-700" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="งานที่ต้องทำ" actionText="เปิดบอร์ดงาน">
        <div className="space-y-3">
          {[
            "รวบรวมการใช้เชื้อเพลิงจากโรงงาน A",
            "ตรวจสอบบิลไฟฟ้าสำนักงานใหญ่",
            "อนุมัติข้อมูลการเดินทาง",
          ].map((task) => (
            <div key={task} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {task}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
