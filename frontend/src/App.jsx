import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BugSolver from "./pages/BugSolver";
import StartInvestigation from "./pages/StartInvestigation";
import History from "./pages/History";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/start/:errorId" element={<StartInvestigation />} />
      <Route path="/bug/:id" element={<BugSolver />} />
      <Route path="/history" element={<History />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
