// Import del archivo css
import './assets/css/App.css'
// Import de los componentes Pages
import MenuPrincipal from './pages/MenuPrincipal.jsx'
import Empleados from "./pages/Empleados.jsx"
import Cliente from "./pages/Cliente.jsx"
import Servicios from "./pages/Servicios.jsx"
import Proveedores from "./pages/Proveedores.jsx"
import Repuestos from "./pages/Repuestos.jsx"
import Ordenes from "./pages/Ordenes.jsx"
import Usuarios from "./pages/Usuarios.jsx"

// Import de los componentes reutilizables
import Encabezado from './components/Encabezado.jsx'

// Import de hooks de react
import { BrowserRouter, Routes, Route } from "react-router-dom"

function App() {
  return (
    <>
      <BrowserRouter>
        <Encabezado />
        <main>
          <Routes>
            <Route path='/' element={<MenuPrincipal />} />
            <Route path='/clientes' element={<Cliente />} />
            <Route path='/empleados' element={<Empleados />} />
            <Route path='/repuestos' element={<Repuestos />} />
            <Route path='/ordenes' element={<Ordenes />} />
            <Route path='/usuarios' element={<Usuarios />} />
            <Route path='/servicios' element={<Servicios />} />
            <Route path='/proveedores' element={<Proveedores />} />
          </Routes>
        </main>
      </BrowserRouter>
    </>
  )
}

export default App
