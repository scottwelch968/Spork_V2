
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
				admin: {
					bg: 'hsl(var(--admin-bg))',
					'bg-elevated': 'hsl(var(--admin-bg-elevated))',
					'bg-muted': 'hsl(var(--admin-bg-muted))',
					'bg-subtle': 'hsl(var(--admin-bg-subtle))',
					text: 'hsl(var(--admin-text))',
					'text-muted': 'hsl(var(--admin-text-muted))',
					'text-subtle': 'hsl(var(--admin-text-subtle))',
					border: 'hsl(var(--admin-border))',
					'border-muted': 'hsl(var(--admin-border-muted))',
					'border-focus': 'hsl(var(--admin-border-focus))',
					accent: 'hsl(var(--admin-accent))',
					'accent-hover': 'hsl(var(--admin-accent-hover))',
					'accent-muted': 'hsl(var(--admin-accent-muted))',
					secondary: 'hsl(var(--admin-secondary))',
					'secondary-text': 'hsl(var(--admin-secondary-text))',
					success: 'hsl(var(--admin-success))',
					'success-muted': 'hsl(var(--admin-success-muted))',
					warning: 'hsl(var(--admin-warning))',
					'warning-muted': 'hsl(var(--admin-warning-muted))',
					error: 'hsl(var(--admin-error))',
					'error-muted': 'hsl(var(--admin-error-muted))',
					info: 'hsl(var(--admin-info))',
					'info-muted': 'hsl(var(--admin-info-muted))',
					hover: 'hsl(var(--admin-hover))',
					active: 'hsl(var(--admin-active))',
					'focus-ring': 'hsl(var(--admin-focus-ring))',
					muted: 'hsl(var(--admin-bg-muted))',
					card: 'hsl(var(--admin-bg-elevated))',
					sidebar: {
						bg: 'hsl(var(--admin-sidebar-bg))',
						text: 'hsl(var(--admin-sidebar-text))',
						accent: 'hsl(var(--admin-sidebar-accent))',
						border: 'hsl(var(--admin-sidebar-border))',
						hover: 'hsl(var(--admin-sidebar-hover))',
						ring: 'hsl(var(--admin-sidebar-ring))',
					},
					chart: {
						'1': 'hsl(var(--admin-chart-1))',
						'2': 'hsl(var(--admin-chart-2))',
						'3': 'hsl(var(--admin-chart-3))',
						'4': 'hsl(var(--admin-chart-4))',
						'5': 'hsl(var(--admin-chart-5))',
					},
				},
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
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))',
				hover: 'hsl(var(--sidebar-hover))'
			},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
				'page-title': 'hsl(var(--page-title))',
				heading: 'hsl(var(--heading))',
				'heading-light': 'hsl(var(--heading-light))',
				// Brand colors
				"monnai-blue": "#5100ff",
				"monnai-yellow": "#fb9400",
				"monnai-pink": "#ff00aa",
				"deep-black": "#000000",
				"clear-white": "#ffffff",
				"monnai-gradient": {
					from: "#fb9400",
					via: "#ff00aa",
					to: "#5100ff"
				}
			},
			fontFamily: {
				'roboto-slab': ['"Roboto Slab"', 'serif'],
				'crete-round': ['"Crete Round"', 'serif'],
			},
			borderRadius: {
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)',
				'2xl': 'var(--radius-2xl)',
				md: 'calc(var(--radius-lg) - 2px)',
				sm: 'calc(var(--radius-lg) - 4px)'
			},
			boxShadow: {
				soft: '0 12px 28px rgba(0,0,0,0.08)',
				pop: '0 18px 40px rgba(0,0,0,0.12)',
				inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
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
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '0.35' },
					'50%': { opacity: '0.8' },
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
