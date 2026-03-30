import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Uploads from './pages/Uploads';
import Visualization from './pages/Visualization';
import Customers from './pages/Customers';
import CashFlow from './pages/CashFlow';
import FixedExpenses from './pages/FixedExpenses';
import MonthlySummaryPage from './pages/MonthlySummaryPage';
import FinancialGoalPage from './pages/FinancialGoalPage';
import RealEstatePage from './pages/RealEstatePage';

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
      {
        path: 'fixed-expenses',
        element: <FixedExpenses />,
      },
      {
        path: 'monthly-summary',
        element: <MonthlySummaryPage />,
      },
      {
        path: 'financial-goal',
        element: <FinancialGoalPage />,
      },
      {
        path: 'real-estate',
        element: <RealEstatePage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

