import { useUser, useOrganization, UserButton, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Assuming you have toast or will add simple alerts

const StudentDashboard = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'linked' | 'unlinked'>('loading');
  const [parentCode, setParentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const response = await axios.get('http://localhost:5000/api/student/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success && response.data.profile.isLinked) {
          setConnectionStatus('linked');
        } else {
          setConnectionStatus('unlinked');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setConnectionStatus('unlinked'); // Default to unlinked on error for now
      }
    };

    fetchProfile();
  }, [getToken]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentCode.trim()) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await axios.post('http://localhost:5000/api/connection/link', { connectionCode: parentCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnectionStatus('linked');
      setParentCode('');
      // toast.success("Connected to parent!");
      alert("Connected to parent successfully!");
    } catch (error: any) {
      console.error('Connection error:', error);
      // toast.error(error.response?.data?.message || "Failed to connect");
      alert(error.response?.data?.message || "Failed to connect");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
              <p className="text-xs text-gray-500">Organization</p>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Activity / Overview Card */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 col-span-1 md:col-span-2 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">My Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">Courses Enrolled</p>
                <p className="text-2xl font-bold text-blue-900">0</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 font-medium">Assignments Due</p>
                <p className="text-2xl font-bold text-green-900">0</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600 font-medium">Completed Quizzes</p>
                <p className="text-2xl font-bold text-purple-900">0</p>
              </div>
            </div>
          </div>

          {/* Quick Actions / Notices */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Notifications</h2>
            <p className="text-gray-500 text-sm">No new notifications.</p>
          </div>

          {/* Connection Status Section */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 col-span-1 md:col-span-3">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Parent Connection</h2>
            {connectionStatus === 'loading' ? (
              <p className="text-gray-500">Checking status...</p>
            ) : connectionStatus === 'linked' ? (
              <div className="flex items-center text-green-700 bg-green-50 p-4 rounded-lg border border-green-200">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">You are connected to your parent account.</span>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Enter the code provided by your parent to link your accounts.</p>
                <form onSubmit={handleConnect} className="flex gap-4 items-end">
                  <div className="flex-1 max-w-xs">
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Parent Code</label>
                    <input
                      type="text"
                      id="code"
                      value={parentCode}
                      onChange={(e) => setParentCode(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      placeholder="e.g. TEAM-123"
                      disabled={isSubmitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !parentCode}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Connecting...' : 'Connect'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
