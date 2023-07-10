import React from "react";
import "./home.css";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="App">
      <h1 className="brand">Vimdeo Call</h1>
      <div className="joinRoom">
        <Link to={`/lobby/`} className="join-room-button">
          Join Call
        </Link>
      </div>
      <footer>
        <p className="signature"> Crafted with ❤️ by Ajay Yadav</p>
      </footer>
    </div>
  );
}

export default HomePage;
