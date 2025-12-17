import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        instagram: {
          pink: '#E1306C',
          purple: '#833AB4',
          orange: '#F77737',
          yellow: '#FCAF45',
          blue: '#0095F6',
        },
        light: {
          primary: '#FFFFFF',
          secondary: '#FAFAFA',
          tertiary: '#EFEFEF',
          border: '#DBDBDB',
          text: '#262626',
          muted: '#8E8E8E',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'instagram-gradient': 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
        'story-gradient': 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
      },
    },
  },
  plugins: [],
}
export default config
