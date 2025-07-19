export function unwrap<T>(value: T | null | undefined, msg?: string): T {
	if (value === null || value === undefined) {
		throw new Error(msg ?? 'Value was null');
	}

	return value;
}

export function format(value: number) {
	return `${Math.round(value * 1000) / 10}%`;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
