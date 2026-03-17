import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Shows from './pages/Shows';
import Movies from './pages/Movies';
import Lists from './pages/Lists';
import Search from './pages/Search';
import Assistant from './pages/Assistant';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="shows" element={<Shows />} />
            <Route path="movies" element={<Movies />} />
            <Route path="lists" element={<Lists />} />
            <Route path="search" element={<Search />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
