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
import Reportes from "./components/Reportes.jsx"
import Login from "./components/Login.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"

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
              <Route path='/login' element={<Login />} />
              <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path='/clientes' element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
              <Route path='/empleados' element={<ProtectedRoute><Empleados /></ProtectedRoute>} />
              <Route path='/repuestos' element={<ProtectedRoute><Repuestos /></ProtectedRoute>} />
              <Route path='/ordenes' element={<ProtectedRoute><Ordenes /></ProtectedRoute>} />
              <Route path='/usuarios' element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
              <Route path='/servicios' element={<ProtectedRoute><Servicios /></ProtectedRoute>} />
              <Route path='/proveedores' element={<ProtectedRoute><Proveedores /></ProtectedRoute>} />
              <Route path='/dispositivos' element={<ProtectedRoute><Dispositivos /></ProtectedRoute>} />
              <Route path='/reportes' element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
        <PiePagina />
      </BrowserRouter>
    </div>
  )
}

export default App
