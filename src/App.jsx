import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import ExchangeRateChartPage from "./pages/ExchangeRateChartPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chart" element={<ExchangeRateChartPage />} />
      </Routes>
    </BrowserRouter>
  )
}
