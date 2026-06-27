import type { PropsWithChildren } from "react"
import { App as AntdApp, ConfigProvider, theme } from "antd"
import thTH from "antd/locale/th_TH"

const appFont = '"Chakra Petch", "Noto Sans Thai", system-ui, sans-serif'

export function Provider({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#0f766e",
          colorBgLayout: "#f3f6fb",
          colorBorderSecondary: "#d9e1ec",
          borderRadius: 10,
          fontFamily: appFont,
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
