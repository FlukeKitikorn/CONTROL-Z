import type { ReactNode } from "react"

interface AuthSplitLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

/** โลโก้: วางที่ public/images/bg-logo.png (หรือเปลี่ยน path ตามไฟล์จริง) */
const AUTH_LOGO = "/images/bg-logo.png"

export function AuthSplitLayout({ children, title, subtitle }: AuthSplitLayoutProps) {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-overlay" aria-hidden />
        <div className="auth-hero-inner">
          <div className="auth-hero-logo-strip">
            <div className="auth-hero-logo-box">
              <img
                src={AUTH_LOGO}
                alt=""
                className="auth-hero-logo-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="auth-form-pane">
        <div className="auth-form-wrap">
          <h2>{title}</h2>
          <p>{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  )
}
