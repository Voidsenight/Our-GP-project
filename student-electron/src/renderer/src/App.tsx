import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp, useOrganization, OrganizationSwitcher, Protect, UserButton, useAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import StudentDashboard from './components/dashboard/StudentDashboard'
import { useEffect } from 'react'
import axios from 'axios'

function HelloUser() {
  const { organization, isLoaded } = useOrganization();
  const { getToken, userId, orgRole } = useAuth();

  const hasRecognizedRole = ['org:student', 'org:teacher', 'org:parent'].includes(orgRole as string);

  useEffect(() => {
    const syncUser = async () => {
      if (userId) {
        try {
          const token = await getToken();
          await axios.post('http://localhost:5000/api/student/sync', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("User synced with MongoDB");
        } catch (error) {
          console.error("Sync failed:", error);
        }
      }
    };

    syncUser();
  }, [userId, getToken]);

  // Handle loading state
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle no organization selected (Show welcome/create screen)
  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="absolute top-4 right-4">
          <UserButton />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Student App</h1>
          <p className="text-gray-600 mb-6">Please create or join an organization as a to continue.</p>
          <div className="flex justify-center">
            <OrganizationSwitcher afterCreateOrganizationUrl="/" hidePersonal={true} />
          </div>
        </div>
      </div>
    );
  }

  // Handle organization selected (Show role-specific content)
  return (
    <div className="flex flex-col h-screen w-full">
      {/* Role-specific dashboards */}
      <Protect role="org:student">
        <StudentDashboard />
      </Protect>

      <Protect role="org:teacher">
        <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gray-50">
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <OrganizationSwitcher afterCreateOrganizationUrl="/" />
            <UserButton />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Teacher Access</h2>
          <p className="text-gray-600 mb-4">
            This application is designed for Students.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800">
            Please use the <strong>Teacher App</strong> (teacher-next) content management and class administration.
          </div>
        </div>
      </Protect>

      <Protect role="org:parent">
        <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gray-50">
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <OrganizationSwitcher afterCreateOrganizationUrl="/" />
            <UserButton />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Parent Access</h2>
          <p className="text-gray-600 mb-4">
            This application is designed for Students.
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800">
            Please use the <strong>Parent App</strong> (parent-reactNative) to monitor your child's progress.
          </div>
        </div>
      </Protect>

      {/* Fallback for users with no matching role in the organization */}
      {!hasRecognizedRole && (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gray-50">
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <OrganizationSwitcher afterCreateOrganizationUrl="/" />
            <UserButton />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Restricted</h2>
          <p className="text-gray-500">You are a member of <strong>{organization.name}</strong> but do not have a recognized role (Student, Teacher, or Parent).</p>
          <p className="text-sm text-gray-400 mt-2">Please contact your organization administrator.</p>
        </div>
      )}
    </div>
  )
}

function App(): JSX.Element {

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route
          path="/sign-in/*"
          element={
            <div className="flex items-center justify-center h-screen">
              <SignIn routing="path" path="/sign-in" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="flex items-center justify-center h-screen">
              <SignUp routing="path" path="/sign-up" unsafeMetadata={{ role: 'student' }} />
            </div>
          }
        />
        <Route
          path="/sso-callback"
          element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl="/" signInForceRedirectUrl="/" />}
        />
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <HelloUser />
              </SignedIn>
              <SignedOut>
                <div className="flex items-center justify-center h-screen bg-gray-50">
                  <div className="w-full max-w-md">
                    <SignIn />
                  </div>
                </div>
              </SignedOut>
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App
