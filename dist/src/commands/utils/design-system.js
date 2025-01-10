"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.designSystems = void 0;
exports.designSystems = {
    basic: `theme: {
      extend: {
        colors: {
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: "hsl(var(--hue-accent),var(--saturation-accent),var(--lightness-accent))",
          "accent-hover": "hsl(var(--hue-accent),var(--saturation-accent),calc(var(--lightness-accent) + 10%))",
          "accent-active": "hsl(var(--hue-accent),var(--saturation-accent),calc(var(--lightness-accent) - 10%))",
          "accent-disabled": "hsl(var(--hue-accent),var(--saturation-accent),calc(var(--lightness-accent) + 30%))",
          border: "var(--border)",
          current: "currentColor",
        },
        fontSize: {
          "display-xs": "var(--text-display-xs)",
          "display-sm": "var(--text-display-sm)",
          "display-md": "var(--text-display-md)",
          "display-lg": "var(--text-display-lg)",
          "heading-xs": "var(--text-heading-xs)",
          "heading-sm": "var(--text-heading-sm)",
          "heading-md": "var(--text-heading-md)",
          "heading-lg": "var(--text-heading-lg)",
          "heading-xl": "var(--text-heading-xl)",
          "heading-xxl": "var(--text-heading-xxl)",
          "label-xs": "var(--text-label-xs)",
          "label-sm": "var(--text-label-sm)",
          "label-md": "var(--text-label-md)",
          "label-lg": "var(--text-label-lg)",
          "paragraph-xs": "var(--text-paragraph-xs)",
          "paragraph-sm": "var(--text-paragraph-sm)",
          "paragraph-md": "var(--text-paragraph-md)",
          "paragraph-lg": "var(--text-paragraph-lg)",
        },
        lineHeight: {
          "display-xs": "var(--leading-display-xs)",
          "display-sm": "var(--leading-display-sm)",
          "display-md": "var(--leading-display-md)",
          "display-lg": "var(--leading-display-lg)",
          "heading-xs": "var(--leading-heading-xs)",
          "heading-sm": "var(--leading-heading-sm)",
          "heading-md": "var(--leading-heading-md)",
          "heading-lg": "var(--leading-heading-lg)",
          "heading-xl": "var(--leading-heading-xl)",
          "heading-xxl": "var(--leading-heading-xxl)",
          "label-xs": "var(--leading-label-xs)",
          "label-sm": "var(--leading-label-sm)",
          "label-md": "var(--leading-label-md)",
          "label-lg": "var(--leading-label-lg)",
          "paragraph-xs": "var(--leading-paragraph-xs)",
          "paragraph-sm": "var(--leading-paragraph-sm)",
          "paragraph-md": "var(--leading-paragraph-md)",
          "paragraph-lg": "var(--leading-paragraph-lg)",
        },
        borderRadius: {
          DEFAULT: "var(--corner-primary)",
          lg: "var(--corner-primary-lg)",
        },
      },
    }`,
    shadcn: `theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
      },
    }`
};
