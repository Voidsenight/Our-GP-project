'use client';
import { useAuth, useUser, OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import TeacherDashboard from "../components/dashboard/TeacherDashboard";

export default function Home() {
  const { isLoaded, orgRole } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user has the specific teacher role or is the admin/creator of the org
  if (orgRole === 'org:teacher' || orgRole === 'org:admin') {
    return <TeacherDashboard />;
  }

  // Fallback / Access Denied for everyone else (including students/parents)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-600 mb-6">
          Welcome, {user?.firstName}.<br />
          Please sign in with a <strong>Teacher</strong> account to access this dashboard.
        </p>

        {/* If they are in an org but not a teacher, show switcher to change org/account */}
        <div className="flex justify-center">
          <OrganizationSwitcher afterCreateOrganizationUrl="/" hidePersonal={true} />
        </div>
      </div>
    </div>
  );
}
