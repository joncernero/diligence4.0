'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { residentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'success';

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [inviteData, setInviteData] = useState<any>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    residentsApi.validateInvite(token)
      .then((res) => {
        setInviteData(res.data);
        setStatus('valid');
      })
      .catch((err) => {
        const msg = err.response?.data?.error || '';
        if (msg.includes('expired')) setStatus('expired');
        else if (msg.includes('already accepted')) setStatus('accepted');
        else setStatus('invalid');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setSubmitting(true);
    try {
      const res = await residentsApi.acceptInvite({
        token,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });

      // Store token and redirect to resident dashboard
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setStatus('success');
      setTimeout(() => router.push('/resident'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <div className='flex items-center justify-center gap-2 mb-8'>
          <div className='w-10 h-10 bg-[#08144800] rounded-xl flex items-center justify-center'>
            <Building2 className='h-6 w-6 text-[#2563eb]' />
          </div>
          <span className='text-2xl font-bold text-gray-900'>Diligence</span>
        </div>

        <Card>
          <CardHeader>
            {status === 'loading' && (
              <>
                <CardTitle>Validating invite…</CardTitle>
                <CardDescription>Just a moment.</CardDescription>
              </>
            )}
            {status === 'valid' && (
              <>
                <CardTitle>Set up your account</CardTitle>
                <CardDescription>
                  You've been invited to receive updates about your property.
                  {inviteData?.unitNumber && (
                    <span className='block mt-1 font-medium text-gray-700'>
                      Unit: {inviteData.unitNumber}
                    </span>
                  )}
                </CardDescription>
              </>
            )}
            {status === 'success' && (
              <>
                <CardTitle className='flex items-center gap-2 text-green-700'>
                  <CheckCircle className='h-5 w-5' />
                  Account created!
                </CardTitle>
                <CardDescription>Redirecting you to your dashboard…</CardDescription>
              </>
            )}
            {(status === 'invalid' || status === 'expired' || status === 'accepted') && (
              <>
                <CardTitle className='flex items-center gap-2 text-red-700'>
                  <AlertCircle className='h-5 w-5' />
                  {status === 'expired' ? 'Invite expired' : status === 'accepted' ? 'Already accepted' : 'Invalid invite'}
                </CardTitle>
                <CardDescription>
                  {status === 'expired'
                    ? 'This invite link has expired. Ask your property manager to send a new one.'
                    : status === 'accepted'
                      ? 'This invite has already been used. Try logging in instead.'
                      : 'This invite link is not valid.'}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {status === 'loading' && (
              <div className='flex justify-center py-8'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
              </div>
            )}

            {status === 'valid' && (
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='firstName'>First name</Label>
                    <Input
                      id='firstName'
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='lastName'>Last name</Label>
                    <Input
                      id='lastName'
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='email'>Email</Label>
                  <Input id='email' value={inviteData?.email || ''} disabled className='bg-gray-50' />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='password'>Password</Label>
                  <Input
                    id='password'
                    type='password'
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder='At least 8 characters'
                    required
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='confirm'>Confirm password</Label>
                  <Input
                    id='confirm'
                    type='password'
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <p className='text-sm text-red-600 flex items-center gap-1.5'>
                    <AlertCircle className='h-4 w-4 shrink-0' />
                    {error}
                  </p>
                )}

                <Button type='submit' className='w-full' disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Create my account'}
                </Button>
              </form>
            )}

            {(status === 'invalid' || status === 'expired') && (
              <Button variant='outline' className='w-full' onClick={() => router.push('/login')}>
                Go to login
              </Button>
            )}

            {status === 'accepted' && (
              <Button className='w-full' onClick={() => router.push('/login')}>
                Log in
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
