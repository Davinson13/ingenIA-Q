import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { VerifyPage } from './pages/auth/VerifyPage';

// Shared Components
import { MainLayout } from './components/shared/MainLayout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { ProfilePage } from './pages/shared/ProfilePage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CalendarPage } from './pages/student/CalendarPage';
import { AiTutorPage } from './pages/student/AiTutorPage';
import { StudentCoursesPage } from './pages/student/StudentCoursesPage';
import { StudentCourseDetail } from './pages/student/StudentCourseDetail';
import { StudentTutoringPage } from './pages/student/StudentTutoringPage';
import { CatalogPage } from './pages/student/CatalogPage';
import { StudentHistoryPage } from './pages/student/StudentHistoryPage';
import { StudentMeshPage } from './pages/student/StudentMeshPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage';
import { TeacherGradesPage } from './pages/teacher/TeacherGradesPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { TeacherCalendar } from './pages/teacher/TeacherCalendar';
import { TeacherCourseDetail } from './pages/teacher/TeacherCourseDetail';
import { TeacherActivityGradePage } from './pages/teacher/TeacherActivityGradePage';
import { TeacherTutoring } from './pages/teacher/TeacherTutoring';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPeriodsPage } from './pages/admin/AdminPeriodsPage';
import { AdminAcademicPage } from './pages/admin/AdminAcademicPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

function App() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      
      {/* Default redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ======================================================= */}
      {/* 2. STUDENT AREA (Base Path: /dashboard)                 */}
      {/* ======================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="subjects" element={<StudentCoursesPage />} />
          <Route path="course/:id" element={<StudentCourseDetail />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
          <Route path="tutorings" element={<StudentTutoringPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="history" element={<StudentHistoryPage />} />
          <Route path="mesh" element={<StudentMeshPage />} />
          <Route path="catalog" element={<CatalogPage />} />
        </Route>
      </Route>

      {/* ======================================================= */}
      {/* 3. TEACHER AREA (Base Path: /teacher)                   */}
      {/* ======================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']} />}>
        <Route path="/teacher" element={<MainLayout />}>
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCoursesPage />} />
          <Route path="course/:id" element={<TeacherCourseDetail />} />
          <Route path="course/:courseId/activity/:activityId/grade" element={<TeacherActivityGradePage />} />
          <Route path="grades" element={<TeacherGradesPage />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="calendar" element={<TeacherCalendar />} />
          <Route path="tutorings" element={<TeacherTutoring />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ======================================================= */}
      {/* 4. ADMIN AREA (Base Path: /admin)                       */}
      {/* ======================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<MainLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="periods" element={<AdminPeriodsPage />} />
          <Route path="academic" element={<AdminAcademicPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;