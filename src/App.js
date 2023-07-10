import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LobbyPage from "./pages/lobby";
import HomePage from "./pages/home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby" element={<LobbyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
