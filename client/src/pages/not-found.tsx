import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-700 mb-4">404</h1>
        <p className="text-xl text-indigo-600 mb-8">Page not found</p>
        <Link href="/" className="bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600">
          Go Home
        </Link>
      </div>
    </div>
  );
}