import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Assessment from './components/Assessment';
import CourseList from './components/CourseList';
import CourseLearn from './components/CourseLearn';
import AssessmentManagement from './components/AssessmentManagement';
import ProgressAnalysis from './components/ProgressAnalysis';
import CourseForm from './components/CourseForm';
import PrivateRoute from './components/PrivateRoute';
import InstructorDashboard from './components/InstructorDashboard';
import StudentDashboard from './components/StudentDashboard';
import './App.css';

function App() {
  const DashboardSelector = () => {
    const { user } = useAuth();
    if (!user) return null;
    if ((user.role || '').toLowerCase() === 'instructor') {
      return <InstructorDashboard />;
    } else {
      return <StudentDashboard />;
    }
  };

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <div className="container py-4">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardSelector />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assessment/:id"
                element={
                  <PrivateRoute allowedRoles={['Student']}>
                    <Assessment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <PrivateRoute>
                    <CourseList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/courses/new"
                element={
                  <PrivateRoute allowedRoles={['Instructor']}>
                    <CourseForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/courses/:courseId/learn"
                element={
                  <PrivateRoute allowedRoles={['Student']}>
                    <CourseLearn />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assessments/manage"
                element={
                  <PrivateRoute allowedRoles={['Instructor']}>
                    <AssessmentManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <PrivateRoute allowedRoles={['Instructor']}>
                    <ProgressAnalysis />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <DashboardSelector />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
