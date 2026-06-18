import { BrowserRouter, Route, Routes } from "react-router-dom";
import ClassicLayout from "@/layouts/ClassicLayout";
import ImmersiveLayout from "@/layouts/ImmersiveLayout";
import ImmersionLayout from "@/layouts/ImmersionLayout";
import ForestSim from "@/pages/ForestSim";
import WebHub from "@/pages/WebHub";
import "@/styles/App.scss";

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/immerse" element={<ImmersiveLayout />} />
                    <Route path="/immersion" element={<ImmersionLayout />} />
                    <Route path="/sim" element={<ForestSim />} />
                    <Route path="/web" element={<WebHub />} />
                    <Route path="/:tab" element={<ClassicLayout />} />
                    <Route path="/" element={<ImmersiveLayout />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
