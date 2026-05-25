import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/student/Dashboard';
import QA from './pages/student/QA';
import Compare from './pages/student/Compare';
import CasePage from './pages/student/Case';
import Role from './pages/student/Role';
import Quiz from './pages/student/Quiz';
import Lab from './pages/student/Lab';
import Graph from './pages/student/Graph';
import IdeologyTasks from './pages/student/IdeologyTasks';
import IdeologyReflectionPage from './pages/student/IdeologyReflection';
import KB from './pages/teacher/KB';
import Cases from './pages/teacher/Cases';
import Stats from './pages/teacher/Stats';
import Logs from './pages/teacher/Logs';
import IdeologyElements from './pages/teacher/IdeologyElements';
import IdeologyMappings from './pages/teacher/IdeologyMappings';
import IdeologyDesign from './pages/teacher/IdeologyDesign';
import IdeologyTaskBoard from './pages/teacher/IdeologyTaskBoard';
import IdeologyAnalytics from './pages/teacher/IdeologyAnalytics';
import { useAuth } from './store';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate to={user.role === 'student' ? '/student/dashboard' : '/teacher/kb'} replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/student/dashboard" element={<Dashboard />} />
          <Route path="/student/qa" element={<QA />} />
          <Route path="/student/compare" element={<Compare />} />
          <Route path="/student/case" element={<CasePage />} />
          <Route path="/student/role" element={<Role />} />
          <Route path="/student/quiz" element={<Quiz />} />
          <Route path="/student/lab" element={<Lab />} />
          <Route path="/student/graph" element={<Graph />} />
          <Route path="/student/ideology" element={<IdeologyTasks />} />
          <Route path="/student/ideology/:taskId" element={<IdeologyReflectionPage />} />
          <Route path="/teacher/kb" element={<KB />} />
          <Route path="/teacher/cases" element={<Cases />} />
          <Route path="/teacher/stats" element={<Stats />} />
          <Route path="/teacher/logs" element={<Logs />} />
          <Route path="/teacher/ideology/elements" element={<IdeologyElements />} />
          <Route path="/teacher/ideology/mappings" element={<IdeologyMappings />} />
          <Route path="/teacher/ideology/design" element={<IdeologyDesign />} />
          <Route path="/teacher/ideology/tasks" element={<IdeologyTaskBoard />} />
          <Route path="/teacher/ideology/analytics" element={<IdeologyAnalytics />} />
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
