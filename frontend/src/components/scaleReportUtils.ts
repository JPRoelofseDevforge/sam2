// Utility functions for ScaleReport components

export const safeValue = (val: number | undefined): number => typeof val === 'number' && !isNaN(val) ? val : 0;