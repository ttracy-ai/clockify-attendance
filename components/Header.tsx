'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HeaderProps {
  currentPage: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Live Update', path: '/live-update' },
    { name: 'CSV Manager', path: '/csv-manager' },
    { name: 'Manage Students', path: '/students' },
  ];

  return (
    <header className="border-b border-neutral-700/50 bg-neutral-800/30 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={48}
              height={48}
              className="rounded-full"
            />
            <h1 className="text-xl font-bold text-white">{currentPage}</h1>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-4">
            {navItems.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-4">
                {index > 0 && <span className="text-neutral-600">|</span>}
                {item.name === currentPage ? (
                  <span className="text-sm text-brand-green-400 font-medium">
                    {item.name}
                  </span>
                ) : (
                  <button
                    onClick={() => router.push(item.path)}
                    className="text-sm text-neutral-400 hover:text-brand-green-400 transition-colors"
                  >
                    {item.name}
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-neutral-300 hover:text-white border border-neutral-600 hover:border-brand-green-600 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
