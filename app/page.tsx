import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ error?: string; status?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  
  if (params.status === 'connected') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connected to Strava</h1>
          <p className="text-gray-600 mb-6">Your account is now linked. Webhooks will automatically process elevation updates.</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h2 className="font-semibold text-gray-800 mb-2">How it works:</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500">1.</span>
                Add an activity with elevation in the description (e.g., &quot;300m&quot; or &quot;1000ft&quot;)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">2.</span>
                Strava sends a webhook to this app
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">3.</span>
                We update your activity elevation and clear the description
              </li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  const error = params.error;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">strava-elevation</h1>
        <p className="text-gray-600 mb-6">Update activity elevation from description comments</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-red-700 text-sm">
              {error === 'access_denied' && 'Authorization was denied. Please try again.'}
              {error === 'authentication_failed' && 'Authentication failed. Please try again.'}
              {error === 'missing_code' && 'Missing authorization code. Please try again.'}
              {!['access_denied', 'authentication_failed', 'missing_code'].includes(error) && `Error: ${error}`}
            </p>
          </div>
        )}

        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116zM7.577 14.944l-2.092-4.116H2.42L7.577 24l5.15-10.172h-3.065l-2.085 4.116z"/>
          </svg>
          Connect with Strava
        </a>

        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-left">
          <h2 className="font-semibold text-gray-800 mb-2">Supported formats:</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><code className="bg-gray-200 px-1 rounded">300m</code> or <code className="bg-gray-200 px-1 rounded">300 meters</code></li>
            <li><code className="bg-gray-200 px-1 rounded">1000ft</code> or <code className="bg-gray-200 px-1 rounded">1000 feet</code></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
