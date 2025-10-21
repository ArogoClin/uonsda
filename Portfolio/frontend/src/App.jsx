// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen">
        <Navbar />
        <div className="pt-20"> {/* Adds space below fixed navbar */}
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Placeholder routes for future pages */}
            <Route path="/projects" element={<div className="p-10">Projects Page</div>} />
            <Route path="/about" element={<div className="p-10">About Page</div>} />
            <Route path="/contact" element={<div className="p-10">Contact Page</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
