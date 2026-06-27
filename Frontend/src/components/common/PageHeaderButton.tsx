import { Button } from "antd"
import type { ButtonProps } from "antd"

type PageHeaderButtonProps = Omit<ButtonProps, "variant"> & {
  tone?: "primary" | "secondary"
}

/** ปุ่มมาตรฐานใน PageHeader — primary (teal gradient) / secondary (outline) */
export function PageHeaderButton({
  tone = "secondary",
  className,
  type,
  ...props
}: PageHeaderButtonProps) {
  const toneClass =
    tone === "primary"
      ? "page-header-btn page-header-btn--primary signature-gradient border-0 !text-white"
      : "page-header-btn page-header-btn--secondary"

  return (
    <Button
      type={tone === "primary" ? (type ?? "primary") : (type ?? "default")}
      className={[toneClass, className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}
