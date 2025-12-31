import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import EventDetail from "./EventDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
