import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-orange-600">おたよりポン！</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900">Welcome to おたよりポン！</h2>
              <p className="mt-4 text-xl text-gray-600">アプリが正常に起動しています</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
