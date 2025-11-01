// Primary Brand Color Configuration
export const PRIMARY_COLOR = "#0071e0";
export const PRIMARY_COLOR_LIGHT = "#e6f2ff"; // Lighter shade for backgrounds
export const PRIMARY_COLOR_LIGHTER = "#f0f8ff"; // Even lighter for subtle backgrounds
export const PRIMARY_COLOR_DARK = "#005bb5"; // Darker shade for hover states
export const PRIMARY_COLOR_DARKER = "#004a94"; // Even darker for active states

// Color utility functions
export const getPrimaryColor = () => PRIMARY_COLOR;
export const getPrimaryColorLight = () => PRIMARY_COLOR_LIGHT;
export const getPrimaryColorDark = () => PRIMARY_COLOR_DARK;

// Tailwind color equivalents for gradient classes
// Use these when you need Tailwind gradient classes
export const PRIMARY_GRADIENT = `from-[${PRIMARY_COLOR}] to-[${PRIMARY_COLOR_DARK}]`;

