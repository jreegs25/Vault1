import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Vault from "./views/Vault";
import FollowUps from "./views/FollowUps";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Nav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Vault />} />
            <Route path="/followups" element={<FollowUps />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
