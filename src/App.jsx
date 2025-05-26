import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react'
import './App.css'
import LoginWeb from './components/loginpage/loginpage'
import Dashboard from './components/dashboard/dashboard'

function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginWeb />} />  
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
  )
}

export default App
