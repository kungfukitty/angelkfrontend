import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import HomePage from './routes/HomePage'
import BrandsPage from './routes/BrandsPage'
import MembershipPage from './routes/MembershipPage'
import ContactPage from './routes/ContactPage'
import BioPage from './routes/BioPage'
import MembershipSuccess from './routes/MembershipSuccess'
import MembershipCancel from './routes/MembershipCancel'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'brands', element: <BrandsPage /> },
      { path: 'membership', element: <MembershipPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'bio', element: <BioPage /> },
      { path: 'membership/success', element: <MembershipSuccess /> },
      { path: 'membership/cancel', element: <MembershipCancel /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
