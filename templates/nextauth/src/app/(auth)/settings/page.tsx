import { redirect } from 'next/navigation';
import { auth, signOut } from '../auth';
import { User } from '@/lib/db/schema';

export default async function SettingsPage() {
  const [session] = await Promise.all([auth()]);
  const email = session?.user?.email;
  if (!email || !session.user) {
    redirect('/login');
  }
  const user: User = session.user as User;

  async function handleLogout() {
    'use server';
    await signOut();
    redirect('/login');
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="text-red-500">User not found in the database.</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="mb-2">
        <span className="font-semibold">User ID:</span> {user.id}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Email:</span> {user.email}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Subscription:</span> {user.subscriptionType}
      </div>
      <form action={handleLogout}>
        <button
          type="submit"
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Log out
        </button>
      </form>
    </div>
  );
}