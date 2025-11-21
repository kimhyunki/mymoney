import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Uploads from './pages/Uploads';
import Visualization from './pages/Visualization';
import Customers from './pages/Customers';
import CashFlow from './pages/CashFlow';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'uploads',
        element: <Uploads />,
      },
      {
        path: 'visualization',
        element: <Visualization />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'cashflow',
        element: <CashFlow />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

