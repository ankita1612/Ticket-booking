import { BrowserRouter, Routes, Route } from "react-router-dom";
import EventList from "./components/events/EventList";
import EventDetail from "./components/events/EventDetail";
import NotFound from "./components/NotFound";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EventList />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
