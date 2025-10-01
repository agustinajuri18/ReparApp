// Import de los componentes desde la carpeta components
import Empleados from "./components/Empleados.jsx"
import Clientes from "./components/Clientes.jsx"
import Servicios from "./components/Servicios.jsx"
import Proveedores from "./components/Proveedores.jsx"
import Repuestos from "./components/Repuestos.jsx"
import Ordenes from "./components/Ordenes.jsx"
import Usuarios from "./components/Usuarios.jsx"
import Home from "./components/Home.jsx"
import Dispositivos from "./components/Dispositivos.jsx"

// Import de los componentes reutilizables
import PiePagina from './components/PiePagina.jsx' // <-- Importa el componente PiePagina

// Import de hooks de react
import { BrowserRouter, Routes, Route } from "react-router-dom"

function App() {
  return (
    <div>
      <BrowserRouter>
        <div className="main-background">
          <main>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/clientes' element={<Clientes />} />
              <Route path='/empleados' element={<Empleados />} />
              <Route path='/repuestos' element={<Repuestos />} />
              <Route path='/ordenes' element={<Ordenes />} />
              <Route path='/usuarios' element={<Usuarios />} />
              <Route path='/servicios' element={<Servicios />} />
              <Route path='/proveedores' element={<Proveedores />} />
              <Route path='/dispositivos' element={<Dispositivos />} />
            </Routes>
          </main>
        </div>
        <PiePagina />
      </BrowserRouter>
    </div>
  )
}

export default App
