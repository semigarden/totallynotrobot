import { BrowserRouter, Route, Routes } from "react-router-dom";
import ClassicLayout from "@/layouts/ClassicLayout";
import ImmersiveLayout from "@/layouts/ImmersiveLayout";
import "@/styles/App.scss";

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/immerse" element={<ImmersiveLayout />} />
                    <Route path="/" element={<ClassicLayout />} />
                    <Route path="/:tab" element={<ClassicLayout />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
