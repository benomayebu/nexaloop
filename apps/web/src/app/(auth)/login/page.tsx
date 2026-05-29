import type { Metadata } from 'next';
import { LoginForm } from '@/app/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign in | N.E.X.A Loop',
  description: 'Sign in to your N.E.X.A Loop account to manage supply chain compliance.',
};

export default function LoginPage() {
  return <LoginForm />;
}
