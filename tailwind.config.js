/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - exact match from original CSS
        primary: {
          50: '#dbeafe',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        // Gender-specific Colors
        pink: {
          400: '#ec4899',
          100: '#fce7f3',
        },
        // Secondary Colors
        secondary: {
          500: '#64748b',
          700: '#334155',
          100: '#f1f5f9',
        },
        // Success, Warning, Error
        success: {
          500: '#10b981',
          100: '#d1fae5',
        },
        warning: {
          500: '#fbbf24',
          100: '#fef3c7',
        },
        error: {
          500: '#ef4444',
          100: '#fee2e2',
        },
        danger: {
          500: '#ef4444',
          100: '#fee2e2',
        },
        // Info and Purple Colors
        info: {
          500: '#3b82f6',
          100: '#dbeafe',
        },
        purple: {
          500: '#8b5cf6',
          100: '#ede9fe',
        },
        // Gray Colors for Holiday
        gray: {
          500: '#6b7280',
          100: '#f3f4f6',
          50: '#f9fafb',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        white: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      transitionDuration: {
        'fast': '50ms',
        'normal': '100ms',
        'slow': '150ms',
      },
      width: {
        'sidebar': '280px',
      },
      height: {
        'header': '70px',
      },
      screens: {
        'mobile': '768px',
      },
    },
  },
  plugins: [],
}
