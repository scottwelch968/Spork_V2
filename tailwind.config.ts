
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
			colors: {
				// =============================================
				// ADMIN DESIGN SYSTEM - Isolated from user area
				// Uses original professional shadcn styling
				// =============================================
				// Flattened admin colors for proper Tailwind utility generation
				'admin-bg': 'hsl(var(--admin-bg))',
				'admin-bg-elevated': 'hsl(var(--admin-bg-elevated))',
				'admin-bg-muted': 'hsl(var(--admin-bg-muted))',
				'admin-bg-subtle': 'hsl(var(--admin-bg-subtle))',
				'admin-text': 'hsl(var(--admin-text))',
				'admin-text-muted': 'hsl(var(--admin-text-muted))',
				'admin-text-subtle': 'hsl(var(--admin-text-subtle))',
				'admin-border': 'hsl(var(--admin-border))',
				'admin-border-muted': 'hsl(var(--admin-border-muted))',
				'admin-border-focus': 'hsl(var(--admin-border-focus))',
				'admin-accent': 'hsl(var(--admin-accent))',
				'admin-accent-hover': 'hsl(var(--admin-accent-hover))',
				'admin-accent-muted': 'hsl(var(--admin-accent-muted))',
				'admin-secondary': 'hsl(var(--admin-secondary))',
				'admin-secondary-text': 'hsl(var(--admin-secondary-text))',
				'admin-success': 'hsl(var(--admin-success))',
				'admin-success-muted': 'hsl(var(--admin-success-muted))',
				'admin-warning': 'hsl(var(--admin-warning))',
				'admin-warning-muted': 'hsl(var(--admin-warning-muted))',
				'admin-error': 'hsl(var(--admin-error))',
				'admin-error-muted': 'hsl(var(--admin-error-muted))',
				'admin-info': 'hsl(var(--admin-info))',
				'admin-info-muted': 'hsl(var(--admin-info-muted))',
				'admin-hover': 'hsl(var(--admin-hover))',
				'admin-active': 'hsl(var(--admin-active))',
				'admin-focus-ring': 'hsl(var(--admin-focus-ring))',
				'admin-card': 'hsl(var(--admin-bg-elevated))',
				'admin-sidebar-bg': 'hsl(var(--admin-sidebar-bg))',
				'admin-sidebar-text': 'hsl(var(--admin-sidebar-text))',
				'admin-sidebar-accent': 'hsl(var(--admin-sidebar-accent))',
				'admin-sidebar-border': 'hsl(var(--admin-sidebar-border))',
				'admin-sidebar-hover': 'hsl(var(--admin-sidebar-hover))',
				'admin-sidebar-ring': 'hsl(var(--admin-sidebar-ring))',
				'admin-chart-1': 'hsl(var(--admin-chart-1))',
				'admin-chart-2': 'hsl(var(--admin-chart-2))',
				'admin-chart-3': 'hsl(var(--admin-chart-3))',
				'admin-chart-4': 'hsl(var(--admin-chart-4))',
				'admin-chart-5': 'hsl(var(--admin-chart-5))',
				// =============================================
				// USER DESIGN SYSTEM - Perplexity-inspired
				// =============================================
				// New Perplexity tokens
				bg: 'hsl(var(--bg))',
				fg: 'hsl(var(--fg))',
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				'muted-fg': 'hsl(var(--muted-fg))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'card-fg': 'hsl(var(--card-fg))',
				brand: {
					DEFAULT: 'hsl(var(--brand))',
					hover: 'hsl(var(--brand-hover))',
					fg: 'hsl(var(--brand-fg))'
				},
				danger: {
					DEFAULT: 'hsl(var(--danger))',
					fg: 'hsl(var(--danger-fg))'
				},
				// Legacy Shadcn tokens (preserved for compatibility)
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'pulse-soft': {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.5'
					}
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-up': 'fade-up 220ms ease-out',
				'pulse-soft': 'pulse-soft 1.2s ease-in-out infinite',
			},
			backgroundImage: {
				'monnai-gradient': 'linear-gradient(90deg, #fb9400, #ff00aa, #5100ff)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
