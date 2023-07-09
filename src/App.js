import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LobbyPage from "./pages/lobby";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
