import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PretextBackgroundAlt from "@/components/effect/PretextBackgroundAlt";
import ClassicLayout from "@/layouts/ClassicLayout";
import ImmersiveLayout from "@/layouts/ImmersiveLayout";
import ImmersionLayout from "@/layouts/ImmersionLayout";
import ForestSim from "@/pages/ForestSim";
import WebHub from "@/pages/WebHub";
import Extract from "@/pages/Extract";
import Play from "@/pages/Play";
import "@/styles/App.scss";

function App() {
    return (
        <BrowserRouter>
            <PretextBackgroundAlt />
            <div className="App">
                <Routes>
                    <Route path="/immerse" element={<ImmersiveLayout />} />
                    <Route path="/immersion" element={<ImmersionLayout />} />
                    <Route path="/sim" element={<ForestSim />} />
                    <Route path="/web" element={<WebHub />} />
                    <Route path="/extract" element={<Extract />} />
                    <Route path="/play" element={<Play />} />
                    <Route path="/:tab" element={<ClassicLayout />} />
                    <Route path="/" element={<Navigate to="/gallery" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
