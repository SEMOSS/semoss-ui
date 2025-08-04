import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Color variants for components
 */
export const colorVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white border-primary-500',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white border-secondary-500',
  success: 'bg-success-500 hover:bg-success-600 text-white border-success-500',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white border-warning-500',
  error: 'bg-error-500 hover:bg-error-600 text-white border-error-500',
  outline: 'bg-transparent hover:bg-gray-100 text-gray-700 border-gray-300',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
} as const;

/**
 * Size variants for components
 */
export const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
} as const;

/**
 * Variant types for components
 */
export type ColorVariant = keyof typeof colorVariants;
export type SizeVariant = keyof typeof sizeVariants;

/**
 * Get color classes based on variant
 */
export function getColorClasses(variant: ColorVariant) {
  return colorVariants[variant];
}

/**
 * Get size classes based on variant
 */
export function getSizeClasses(size: SizeVariant) {
  return sizeVariants[size];
}

/**
 * Common button styles
 */
export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500',
  secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-500',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

/**
 * Common input styles
 */
export const inputStyles = {
  base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} as const;

/**
 * Common card styles
 */
export const cardStyles = {
  base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
  header: 'flex flex-col space-y-1.5 p-6',
  content: 'p-6 pt-0',
  footer: 'flex items-center p-6 pt-0',
} as const; 