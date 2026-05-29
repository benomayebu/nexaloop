import type { Metadata } from 'next';
import { RegisterForm } from '@/app/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create account | N.E.X.A Loop',
  description: 'Create your N.E.X.A Loop workspace. 14-day free trial, no credit card required.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
