import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container-responsive py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Welcome to Antragsgrün
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Modern motion and amendment management system for assemblies, associations, and decision-making organizations.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/consultations"
            className="btn btn-primary btn-lg"
          >
            View Consultations
          </Link>
          <Link
            href="/about"
            className="btn btn-ghost btn-lg"
          >
            Learn more
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="mx-auto mt-24 max-w-7xl">
        <div className="grid-responsive">
          <div className="card">
            <div className="card-body">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-4xl">📝</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Motion Management
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Create, edit, and manage motions with ease. Support for multiple formats and workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-4xl">✏️</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Amendment System
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Advanced amendment tracking with line-by-line diff visualization and merge capabilities.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-4xl">🌐</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Multi-language
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Full RTL support for Persian and other languages, with localized interfaces.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
