'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // Test 1: Check if client is initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Test 2: Try to get session (will return null if no user logged in, but proves connection works)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      // Test 3: Get project info
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      setProjectInfo({
        url: projectUrl,
        hasAnonKey,
        session: sessionData.session,
        isConnected: true,
      });

      setConnectionStatus('success');
    } catch (err: any) {
      console.error('Supabase connection error:', err);
      setError(err.message || 'Unknown error');
      setConnectionStatus('error');
    }
  };

  const testOAuthProvider = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        alert(`OAuth Error: ${error.message}`);
      }
      // Redirect will happen automatically if successful
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Supabase Connection Test</h1>
          <p className="text-muted-foreground mt-2">
            Testing connection to your Supabase project
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {connectionStatus === 'testing' && <Loader2 className="w-5 h-5 animate-spin" />}
              {connectionStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {connectionStatus === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              Connection Status
            </CardTitle>
            <CardDescription>
              {connectionStatus === 'testing' && 'Testing connection...'}
              {connectionStatus === 'success' && '✅ Connected successfully!'}
              {connectionStatus === 'error' && '❌ Connection failed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-4">
                <p className="font-semibold">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {projectInfo && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Project URL</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                      {projectInfo.url}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Anon Key</p>
                    <p className="text-sm">
                      {projectInfo.hasAnonKey ? (
                        <span className="text-green-600">✅ Configured</span>
                      ) : (
                        <span className="text-red-600">❌ Missing</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Connection</p>
                    <p className="text-sm">
                      {projectInfo.isConnected ? (
                        <span className="text-green-600">✅ Active</span>
                      ) : (
                        <span className="text-red-600">❌ Failed</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Session</p>
                    <p className="text-sm">
                      {projectInfo.session ? (
                        <span className="text-green-600">✅ Logged in</span>
                      ) : (
                        <span className="text-muted-foreground">⚪ Not logged in</span>
                      )}
                    </p>
                  </div>
                </div>

                {projectInfo.session && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="font-semibold text-green-800">Current User:</p>
                    <p className="text-sm text-green-700">
                      Email: {projectInfo.session.user.email}
                    </p>
                    <p className="text-sm text-green-700">
                      User ID: {projectInfo.session.user.id}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button onClick={testConnection} variant="outline" size="sm">
                Test Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OAuth Provider Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Test OAuth Providers</CardTitle>
            <CardDescription>
              Click a button to test OAuth login flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ⚠️ Note: OAuth providers must be configured in Supabase Dashboard first.
                <br />
                If not configured, you'll see an error from Supabase.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => testOAuthProvider('google')}
                  variant="outline"
                  className="w-full"
                >
                  Test Google
                </Button>
                <Button
                  onClick={() => testOAuthProvider('apple')}
                  variant="outline"
                  className="w-full"
                >
                  Test Apple
                </Button>
                <Button
                  onClick={() => testOAuthProvider('facebook')}
                  variant="outline"
                  className="w-full"
                >
                  Test Facebook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Current configuration from .env.local
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">NEXT_PUBLIC_SUPABASE_URL</p>
                <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
                    : '❌ Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ 1. Connection test passed</p>
              <p>📝 2. Configure OAuth providers in Supabase Dashboard:</p>
              <p className="ml-4 text-muted-foreground">
                → <a
                  href="https://supabase.com/dashboard/project/addlanvirroxsxcgmspd/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Go to Authentication → Providers
                </a>
              </p>
              <p>🧪 3. Test OAuth login using buttons above</p>
              <p>🎉 4. Use authentication in your app</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}