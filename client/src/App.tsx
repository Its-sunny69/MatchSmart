import './App.css'
import Hero from './components/Hero'
import Navbar from './components/Navbar'
import { ThemeProvider } from "@/components/theme-provider"

function App() {

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <div className='w-screen min-h-screen '>
      <Navbar />
      <Hero />
    </div>
    </ThemeProvider>
  )
}

export default App
