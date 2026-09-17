'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

type Theme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'csa-widget-theme';
const ORDER: Theme[] = ['system', 'light', 'dark'];

// Small external store so the toggle stays in sync with localStorage without
// calling setState synchronously inside an effect.
let currentTheme: Theme = 'system';
const listeners = new Set<() => void>();

function readStoredTheme(): Theme {
	if (typeof window === 'undefined') return 'system';
	const stored = localStorage.getItem(STORAGE_KEY) as Theme;
	return ORDER.includes(stored) ? stored : 'system';
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
	return currentTheme;
}

function getServerSnapshot(): Theme {
	return 'system';
}

function systemIsDark(): boolean {
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: Theme): void {
	const dark =
		theme === 'dark' || (theme === 'system' && systemIsDark());
	document.documentElement.classList.toggle('dark', dark);
}

function updateTheme(next: Theme): void {
	localStorage.setItem(STORAGE_KEY, next);
	currentTheme = next;
	applyTheme(next);
	listeners.forEach(listener => listener());
}

function Icon({ theme }: { theme: Theme }) {
	if (theme === 'light') {
		return (
			<svg
				viewBox='0 0 24 24'
				className='h-4 w-4'
				fill='currentColor'
				aria-hidden='true'
			>
				<path d='M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 1.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM12 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 2Zm0 17a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 19ZM2.5 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2.5 12Zm16.25 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM5.28 5.28a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L5.28 6.34a.75.75 0 0 1 0-1.06Zm11.32 11.32a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Zm0-11.32a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06L15.54 5.28a.75.75 0 0 1 1.06 0ZM5.28 18.72a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0Z' />
			</svg>
		);
	}

	if (theme === 'dark') {
		return (
			<svg
				viewBox='0 0 24 24'
				className='h-4 w-4'
				fill='currentColor'
				aria-hidden='true'
			>
				<path d='M21.53 15.93a.75.75 0 0 0-.94-.96 7.5 7.5 0 1 1-9.56-9.56.75.75 0 0 0-.96-.94A9 9 0 1 0 21.53 15.93Z' />
			</svg>
		);
	}

	return (
		<svg
			viewBox='0 0 24 24'
			className='h-4 w-4'
			fill='currentColor'
			aria-hidden='true'
		>
			<rect x='2.5' y='4' width='19' height='12' rx='2' />
			<path d='M8.5 20h7M12 16v4' />
		</svg>
	);
}

export default function ThemeToggle() {
	const theme = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);

	useEffect(() => {
		// Sync the store with localStorage on mount, then follow OS theme changes
		// while in "system" mode.
		updateTheme(readStoredTheme());

		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => {
			if (readStoredTheme() === 'system') applyTheme('system');
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	}, []);

	const cycle = useCallback(() => {
		const next =
			ORDER[(ORDER.indexOf(getSnapshot()) + 1) % ORDER.length];
		updateTheme(next);
	}, []);

	const labels: Record<Theme, string> = {
		system: 'System',
		light: 'Light',
		dark: 'Dark',
	};

	return (
		<button
			type='button'
			onClick={cycle}
			title={`Theme: ${labels[theme]}`}
			aria-label={`Theme: ${labels[theme]}. Click to change.`}
			className='flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800'
		>
			<Icon theme={theme} />
		</button>
	);
}
