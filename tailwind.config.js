/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./public/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'font-heading',
    'font-sans',
    'font-mono',
    'text-pon-orange',
    'text-ink',
    'bg-pon-orange',
    'bg-cream',
    'bg-orange-100',
    'bg-gray-100',
    'bg-gray-200',
    'bg-white',
    'text-white',
    'text-gray-600',
    'text-gray-900',
    'text-blue-600',
    'text-orange-600',
    'hover:bg-orange-600',
    'hover:bg-gray-200',
    'hover:bg-orange-500',
    'hover:bg-blue-600',
    'rounded-xl',
    'rounded-2xl',
    'shadow-md',
    'shadow-lg',
    'shadow-2xl',
    'ring-2',
    'ring-orange-500',
    'ring-sky',
    'border',
    'border-gray-200',
    'border-orange-500',
    'border-white',
    'focus:ring-2',
    'focus:ring-sky',
    'focus:ring-opacity-50',
    'transition-all',
    'duration-200',
    'inline-flex',
    'items-center',
    'justify-center',
    'mx-auto',
    'px-4',
    'px-6',
    'py-3',
    'py-8',
    'mt-2',
    'mb-4',
    'mb-6',
    'mb-8',
    'text-center',
    'text-xl',
    'text-2xl',
    'text-3xl',
    'font-bold',
    'font-medium',
    'font-extrabold',
    'font-semibold',
    'w-full',
    'max-w-lg',
    'max-w-2xl',
    'rounded-lg',
    'rounded-full',
    'shadow',
    'shadow-2xl',
    'hover:scale-105',
    'transition-transform',
    'bg-orange-500',
    'bg-blue-500',
    'hover:bg-blue-600',
    'hover:bg-orange-600',
    'bg-orange-600',
    'bg-transparent',
    'border-2',
    'border-white',
    'text-orange-100',
    'text-green-500',
    'bg-green-50',
    'text-leaf',
    'border-green-200',
    'bg-rose-50',
    'text-plum',
    'border-rose-200',
    'bg-blue-50',
    'text-sky',
    'border-blue-200',
  ],
  theme: {
    extend: {
      // ブランドカラーパレット
      colors: {
        // Primary
        'pon-orange': '#F97316',
        
        // Base
        'cream': '#FFF7ED',
        
        // Text
      'orange-100': '#FFEDD5',
        'ink': '#1F2937',
        
        // Accents
        'sky': '#38BDF8',
        'leaf': '#22C55E',
        'plum': '#F43F5E',
        
        // Brand variations
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // pon-orange
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        }
      },
      
      // ブランドフォント
      fontFamily: {
        'heading': ['"Zen Maru Gothic"', 'sans-serif'],
        'sans': ['"Noto Sans JP"', 'sans-serif'],
        'mono': ['"Inter"', '"Roboto"', 'monospace'],
      },
      
      // ブランド準拠の角丸
      borderRadius: {
        'brand': '1rem', // rounded-2xl equivalent
      },
      
      // ブランド準拠の影
      boxShadow: {
        'brand': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'brand-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      
      // アニメーション時間
      transitionDuration: {
        'brand': '200ms',
      },
      
      // フォーカスリング
      ringColor: {
        'brand': '#38BDF8', // sky color
      },
    },
  },
  plugins: [],
}
