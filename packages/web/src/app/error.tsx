'use client';

export default function Error() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
        <p className="text-xl text-gray-600 mb-8">Something went wrong</p>
        <a href="/" className="text-blue-500 hover:text-blue-700">
          Return to home
        </a>
      </div>
    </div>
  );
} 