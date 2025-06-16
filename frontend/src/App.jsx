import React from 'react'

import './App.css'
import Dashboard from './pages/Dashboard'
import ImageDisplay from './components/ImageDisplay'
import Transaction from './components/Transaction'
import RegisterForm from './components/RegisterForm'
import LoginForm from './components/LoginForm'


const App = () => {
  return (
    <div className='bg-white'>
    <Dashboard />
    <Transaction />
    
    
    </div>
  )
}

export default App
