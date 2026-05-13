import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas públicas
import Login from "./pages/Login";
import Payment from "./pages/Payment";

// Páginas del atleta
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import Profile from "./pages/Profile";
import MedicalFiles from "./pages/MedicalFiles";
import Progress from "./pages/Progress"; // 🔥 IMPORTANTE


// Panel del coach
import CoachLayout   from "./components/coach/CoachLayout";
import CoachDashboard from "./components/coach/CoachDashboard";
import CoachStudents  from "./components/coach/CoachStudents";
import CoachWorkouts  from "./components/coach/CoachWorkouts";
import CoachHistory   from "./components/coach/CoachHistory";
import CoachStats     from "./components/coach/CoachStats";

/* ── Guard general: requiere token ── */
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

/* ── Guard coach: requiere role === "coach" ── */
function CoachRoute({ children }) {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== "coach") return <Navigate to="/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── PÚBLICAS ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/payment" element={<Payment />} />

        {/* ── ATLETA ── */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

          <Route 
  path="/workout/:id"
  element={
    <PrivateRoute>
      <Workout />
    </PrivateRoute>
  }
/>
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />

        {/* 🔥 PROGRESS ARREGLADO */}
        <Route 
          path="/progress" 
          element={
            <PrivateRoute>
              <Progress />
            </PrivateRoute>
          } 
        />
     <Route 
  path="/medicalfiles" 
  element={
    <PrivateRoute>
      <MedicalFiles />
    </PrivateRoute>
  } 
/>

        {/* ── COACH (con sidebar layout) ── */}
        <Route path="/coach" element={<CoachRoute><CoachLayout /></CoachRoute>}>

          <Route index element={<CoachDashboard />} />

          <Route 
            path="students" 
            element={<CoachStudents />} 
          />

          <Route 
            path="workouts" 
            element={<CoachWorkouts />} 
          />

          <Route 
            path="history" 
            element={<CoachHistory />} 
          />

          <Route 
            path="stats" 
            element={<CoachStats />} 
          />

        </Route>

        {/* ── DEFAULT ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}