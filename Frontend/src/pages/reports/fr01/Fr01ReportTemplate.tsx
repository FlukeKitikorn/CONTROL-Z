import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import { Col, Row } from "antd"
import { useMemo } from "react"
import { Bar } from "react-chartjs-2"
import {
  type Fr01ReportViewModel,
  mergeFr01Model,
  resolveFr01LogoUrl,
} from "@/pages/reports/fr01/fr01ReportModel"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const shell =
  "bg-[#f8f9fa] px-4 pb-4 pt-0 font-[family-name:var(--font-fr01,'TH_Sarabun_New','Sarabun',sans-serif)] text-base text-black"

const cell = "border border-black bg-white px-[10px] py-[5px] text-base leading-snug align-top"
const labelCell = `${cell} bg-[#92cd8c] text-center font-bold`
const labelCellStart = `${cell} bg-[#92cd8c] text-start font-bold`

export type Fr01ReportTemplateProps = {
  /** ค่าจาก DB — รวมกับค่าเริ่มต้น placeholder */
  model?: Partial<Fr01ReportViewModel>
}

export function Fr01ReportTemplate({ model: modelProp }: Fr01ReportTemplateProps) {
  const model = useMemo(() => mergeFr01Model(modelProp), [modelProp])
  const logoSrc = resolveFr01LogoUrl(model)

  const chartData = useMemo(
    () => ({
      labels: model.scopeChartBars.map((b) => b.label),
      datasets: [
        {
          data: model.scopeChartBars.map((b) => b.value),
          backgroundColor: model.scopeChartBars.map((b) => b.backgroundColor),
          barPercentage: 0.65,
        },
      ],
    }),
    [model.scopeChartBars],
  )

  const chartOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "tonCO2-eq",
          font: { size: 20, weight: "normal" },
          color: "#111",
        },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          grid: { lineWidth: 0.1, color: "#999" },
          ticks: { font: { size: 11 } },
        },
      },
    }),
    [],
  )

  return (
    <div className={shell}>
      <Row gutter={0}>
        <Col span={10} className={`${cell} border`}>
          <div className="p-3">
            <h5 className="mb-3 mt-0 text-lg font-semibold">รูปภาพประกอบ</h5>
            <div className="flex min-h-[200px] items-center justify-center border border-[#ccc] bg-[#f8f9fa]">
              {model.coverImageUrl ? (
                <img
                  src={model.coverImageUrl}
                  alt="รูปภาพประกอบ"
                  className="max-h-[280px] max-w-full object-contain p-2"
                />
              ) : (
                <span className="text-neutral-600">{"{รูปภาพประกอบ/พรีวิว}"}</span>
              )}
            </div>
          </div>
        </Col>

        <Col span={14} className={`${cell} border-0 p-0`}>
          <Row gutter={0}>
            <Col span={24} className="bg-[#92cd8c] py-2 text-center font-bold">
              ขอบเขตขององค์กร
            </Col>
          </Row>
          <Row gutter={0}>
            <Col span={6} className={labelCell}>
              ขอบเขต 1
            </Col>
            <Col span={18} className={`${cell} text-sm`}>
              การปล่อยก๊าซเรือนกระจกทางตรงขององค์กร (Direct GHG Emissions) <br />
              ได้แก่ การเผาไหม้อยู่กับที่, การเคลื่อนที่, การรั่วไหล
            </Col>
          </Row>
          <Row gutter={0}>
            <Col span={6} className={labelCell}>
              ขอบเขต 2
            </Col>
            <Col span={18} className={`${cell} text-sm`}>
              การปล่อยก๊าซเรือนกระจกทางอ้อมจากการใช้พลังงาน (Energy Indirect GHG) <br />
              ได้แก่ การใช้ไฟฟ้า
            </Col>
          </Row>
          <Row gutter={0}>
            <Col span={6} className={labelCell}>
              ขอบเขต 3
            </Col>
            <Col span={18} className={`${cell} text-sm`}>
              การปล่อยก๊าซเรือนกระจกทางอ้อมอื่นๆ (Other Indirect GHG) <br />
              ได้แก่ การใช้น้ำ, กระดาษ
            </Col>
          </Row>

          <Row gutter={0} className="mt-2">
            <Col span={8} className={labelCellStart}>
              ระยะเวลาเก็บข้อมูล
            </Col>
            <Col span={16} className={cell}>
              {model.period}
            </Col>
          </Row>
          <Row gutter={0}>
            <Col span={8} className={labelCellStart}>
              ผลผลิต
            </Col>
            <Col span={10} className={`${cell} text-end`}>
              {model.value}
            </Col>
            <Col span={6} className={cell}>
              {model.unit}
            </Col>
          </Row>

          <Row gutter={0}>
            <Col span={24} className={`${labelCellStart} px-3`}>
              ข้อมูลองค์กร
            </Col>
          </Row>
          <Row gutter={0}>
            <Col span={2} className={`${cell} text-center`}>
              1
            </Col>
            <Col span={22} className={cell}>
              {model.organizationDetailLine}
            </Col>
          </Row>

          <Row gutter={0} className="mt-2">
            <Col span={8} className={labelCellStart}>
              สถานที่ติดต่อ
            </Col>
            <Col span={16} className={`${cell} text-sm`}>
              {model.addressString}
            </Col>
          </Row>
        </Col>
      </Row>

      <Row gutter={0} className="mt-3 items-stretch">
        <Col span={10} className={`${cell} border flex flex-col p-0`}>
          <div className="shrink-0 bg-[#ff6600] py-1 text-center font-bold text-white">
            การแสดงเครื่องหมาย
          </div>
          <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <img src={logoSrc} alt="Logo" className="max-w-[150px]" />
            <h3 className="m-0 text-2xl font-semibold">{model.badgeLine}</h3>
          </div>
        </Col>
        <Col span={14} className={`${cell} border`}>
          <div className="bg-[#ff6600] py-1 text-center font-bold text-white">
            กราฟแท่งแสดงการปล่อย GHG แต่ละขอบเขต
          </div>
          <div className="chart-box min-h-[400px] p-2">
            <div className="h-[400px] w-full">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
