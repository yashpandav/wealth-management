/**
 * Home Page - Redirects to Login
 * Redirects users directly to the login page
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}
