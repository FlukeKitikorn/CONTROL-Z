import { BrowserRouter } from "react-router"
import { AppRouter } from "@/app/AppRouter"
import { SessionBootstrap } from "@/components/auth/SessionBootstrap"

export default function App() {
  return (
    <BrowserRouter>
      <SessionBootstrap>
        <AppRouter />
      </SessionBootstrap>
    </BrowserRouter>
  )
}
