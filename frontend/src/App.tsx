import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Customers from './pages/Customers';
import CashFlow from './pages/CashFlow';
import FixedExpenses from './pages/FixedExpenses';
import MonthlySummaryPage from './pages/MonthlySummaryPage';
import FinancialGoalPage from './pages/FinancialGoalPage';
import RealEstatePage from './pages/RealEstatePage';
import InvestmentPage from './pages/InvestmentPage';
import LedgerPage from './pages/LedgerPage';
import ImportPage from './pages/ImportPage';
import FinancialStatusPage from './pages/FinancialStatusPage';
import InsurancePage from './pages/InsurancePage';
import LoanPage from './pages/LoanPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'customers', element: <Customers /> },
      { path: 'cashflow', element: <CashFlow /> },
      { path: 'financial-status', element: <FinancialStatusPage /> },
      { path: 'insurance', element: <InsurancePage /> },
      { path: 'investment', element: <InvestmentPage /> },
      { path: 'loans', element: <LoanPage /> },
      { path: 'fixed-expenses', element: <FixedExpenses /> },
      { path: 'monthly-summary', element: <MonthlySummaryPage /> },
      { path: 'financial-goal', element: <FinancialGoalPage /> },
      { path: 'real-estate', element: <RealEstatePage /> },
      { path: 'ledger', element: <LedgerPage /> },
      { path: 'import', element: <ImportPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
