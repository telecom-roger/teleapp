import { useEffect, useState } from "react";
import ResumoMultiLinhaDesktop from "./ResumoMultiLinhaDesktop";
import ResumoMultiLinhaMobile from "./ResumoMultiLinhaMobile";

export default function ResumoMultiLinha() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile ? <ResumoMultiLinhaMobile /> : <ResumoMultiLinhaDesktop />;
}
