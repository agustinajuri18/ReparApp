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
import { PermissionProvider } from './auth/PermissionContext';

function App() {
  return (
    <div>
      <PermissionProvider>
      <BrowserRouter>
        <div className="main-background">
          <main>
            <Routes>
              <Route path='/login' element={<Login />} />
              <Route path='/' element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path='/clientes' element={<ProtectedRoute requiredPermission={32}><Clientes /></ProtectedRoute>} />
              <Route path='/empleados' element={<ProtectedRoute requiredPermission={47}><Empleados /></ProtectedRoute>} />
              <Route path='/repuestos' element={<ProtectedRoute requiredPermission={[19,20,21,22,23]}><Repuestos /></ProtectedRoute>} />
              <Route path='/ordenes' element={<ProtectedRoute requiredPermission={29}><Ordenes /></ProtectedRoute>} />
              <Route path='/usuarios' element={<ProtectedRoute requiredPermission={11}><Usuarios /></ProtectedRoute>} />
              <Route path='/servicios' element={<ProtectedRoute requiredPermission={27}><Servicios /></ProtectedRoute>} />
              <Route path='/proveedores' element={<ProtectedRoute requiredPermission={16}><Proveedores /></ProtectedRoute>} />
              <Route path='/dispositivos' element={<ProtectedRoute requiredPermission={40}><Dispositivos /></ProtectedRoute>} />
              <Route path='/reportes' element={<ProtectedRoute requiredPermission={36}><Reportes /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
        <PiePagina />
      </BrowserRouter>
      </PermissionProvider>
    </div>
  )
}

export default App
