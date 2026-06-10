import { BrowserRouter, Routes, Route } from "react-router-dom";
import QRPage from "@/pages/qr";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<QRPage />} />
      </Routes>
    </BrowserRouter>
  );
}
