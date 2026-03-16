import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Shows from './pages/Shows';
import Movies from './pages/Movies';
import Lists from './pages/Lists';
import Search from './pages/Search';
import Assistant from './pages/Assistant';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="shows" element={<Shows />} />
          <Route path="movies" element={<Movies />} />
          <Route path="lists" element={<Lists />} />
          <Route path="search" element={<Search />} />
          <Route path="assistant" element={<Assistant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
