/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
