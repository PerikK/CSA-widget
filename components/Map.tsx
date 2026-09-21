'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { assessmentMeta } from '@/lib/assessment';
import type {
	CitizenSubmission,
	SubmissionsResponse,
} from '@/lib/types';

type Status = 'loading' | 'ready' | 'error';

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function formatDate(iso: string | null | undefined): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function yesNo(value: boolean | null | undefined): string {
	if (value === true) return 'Yes';
	if (value === false) return 'No';
	return '—';
}

function text(value: string | null | undefined): string {
	return value && value.trim() ? value : '—';
}

function list(value: string[] | null | undefined): string {
	return value && value.length ? value.join(', ') : '—';
}

function detailRow(label: string, value: string): string {
	return `
    <div class="flex items-start gap-1.5 border-b border-zinc-100 py-1.5 dark:border-zinc-800">
      <dt class="text-zinc-500 dark:text-zinc-400">${escapeHtml(label)}:</dt>
      <dd class="font-medium text-zinc-800 dark:text-zinc-200">${escapeHtml(value)}</dd>
    </div>`;
}

function popupHtml(submission: CitizenSubmission): string {
	const meta = assessmentMeta(submission.overallAssessment);
	// `userGeneratedSite` is the field used by `/api/citizens/user-generated-sites/all-submissions`;
	// the `/api/citizens/submissions` endpoint uses `researchSite` instead.
	const site = text(submission.userGeneratedSite);

	const rows = [
		['Recorded by', text(submission.user)],
		['Date', formatDate(submission.createdAt)],
		['Channel form', text(submission.channelForm)],
		['Bottom channel type', text(submission.bottomChannelType)],
		['Bank channel type', text(submission.banksChannelType)],
		['Habitats', list(submission.habitats)],
		['Fallen biomass', list(submission.fallenBiomassTypes)],
		['Water flow', text(submission.waterFlow)],
		['Water color', text(submission.waterColor)],
		['Water abstraction', yesNo(submission.waterAbstraction)],
		['Has dams', yesNo(submission.hasDams)],
		[
			'Number of dams',
			submission.numberOfDams != null
				? String(submission.numberOfDams)
				: '—',
		],
		['Pipes', yesNo(submission.pipes)],
		['Water discharge', yesNo(submission.waterDischarge)],
		['Construction', yesNo(submission.construction)],
		[
			'Water height',
			submission.waterHeight != null
				? `${submission.waterHeight} m`
				: '—',
		],
		[
			'Impervious areas (left)',
			yesNo(submission.imperviousAreasLeft),
		],
		[
			'Impervious areas (right)',
			yesNo(submission.imperviousAreasRight),
		],
		[
			'Vegetation covered (left)',
			yesNo(submission.isVegetationCoveredLeft),
		],
		[
			'Vegetation covered (right)',
			yesNo(submission.isVegetationCoveredRight),
		],
		['Vegetation type (left)', text(submission.vegetationTypeLeft)],
		['Vegetation type (right)', text(submission.vegetationTypeRight)],
		[
			'Invasive species present',
			yesNo(submission.hasInvasivePlantSpecies),
		],
		['Invasive species', text(submission.invasivePlantSpecies)],
		[
			'Recent vegetation cuts',
			yesNo(submission.recentVegetationCuts),
		],
		['Joy', submission.joy != null ? String(submission.joy) : '—'],
		[
			'Serenity',
			submission.serenity != null ? String(submission.serenity) : '—',
		],
		[
			'Anger',
			submission.anger != null ? String(submission.anger) : '—',
		],
		['Fear', submission.fear != null ? String(submission.fear) : '—'],
	]
		.map(([label, value]) => detailRow(label, value))
		.join('');

	return `
    <div class="text-sm font-sans">
      <div class="text-base font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(site)}</div>
      <div class="mt-1 flex items-center gap-2">
        <span class="inline-flex items-center justify-center rounded-full pr-2 py-0.5 text-xs font-semibold leading-none text-white" style="background-color:${meta.color}">
          ${escapeHtml(meta.label)}
        </span>
        <span class="text-xs text-zinc-500 dark:text-zinc-400">${escapeHtml(formatDate(submission.createdAt))}</span>
      </div>
      <details class="mt-2">
        <summary class="cursor-pointer select-none rounded-md px-1 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Details
        </summary>
        <dl class="mt-2 grid max-h-40 grid-cols-1 gap-x-6 overflow-y-auto pr-1 scrollbar-thin md:grid-cols-2 lg:grid-cols-3">${rows}</dl>
      </details>
    </div>`;
}

interface MapProps {
	refreshKey: number;
	onUpdatedAt: (updatedAt: string) => void;
}

export default function Map({ refreshKey, onUpdatedAt }: MapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<L.Map | null>(null);
	const markersRef = useRef<L.LayerGroup | null>(null);
	const [status, setStatus] = useState<Status>('loading');
	const [error, setError] = useState<string | null>(null);

	// Create the Leaflet map once (independent of data fetching/refresh).
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const map = L.map(container, {
			zoomControl: false,
			attributionControl: true,
		});

		L.tileLayer(
			'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			{
				maxZoom: 19,
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			},
		).addTo(map);

		L.control.zoom({ position: 'bottomright' }).addTo(map);

		map.setView([0, 0], 2);
		mapRef.current = map;
		markersRef.current = L.layerGroup().addTo(map);

		return () => {
			map.remove();
			mapRef.current = null;
			markersRef.current = null;
		};
	}, []);

	// Fetch + render markers whenever refreshKey changes (including initial mount).
	useEffect(() => {
		let cancelled = false;

		(async () => {
			setStatus('loading');
			setError(null);

			try {
				const url =
					refreshKey > 0
						? '/api/submissions?refresh=1'
						: '/api/submissions';
				const res = await fetch(url, { cache: 'no-store' });
				if (!res.ok)
					throw new Error(`Request failed with status ${res.status}`);

				const payload: SubmissionsResponse = await res.json();

				if (cancelled) return;

				const points = payload.submissions.filter(
					s =>
						Number.isFinite(s.latitude) &&
						Number.isFinite(s.longitude),
				);

				const map = mapRef.current;
				const markers = markersRef.current;

				if (map && markers) {
					markers.clearLayers();

					for (const submission of points) {
						const meta = assessmentMeta(submission.overallAssessment);
						const marker = L.circleMarker(
							[submission.latitude, submission.longitude],
							{
								radius: 8,
								color: '#ffffff',
								weight: 2,
								fillColor: meta.color,
								fillOpacity: 0.95,
							},
						);
						marker.bindPopup(popupHtml(submission), {
							maxWidth: 860,
						});
						marker.addTo(markers);
					}

					if (points.length > 0) {
						const bounds = L.latLngBounds(
							points.map(
								s => [s.latitude, s.longitude] as [number, number],
							),
						);
						map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
					}
				}

				onUpdatedAt(payload.updatedAt);
				setStatus('ready');
			} catch (err) {
				if (cancelled) return;
				console.error('[Map] failed to load submissions', err);
				setError('Could not load submissions.');
				setStatus('error');
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [refreshKey, onUpdatedAt]);

	return (
		<div className='relative h-full w-full'>
			<div ref={containerRef} className='h-full w-full' />

			{status === 'loading' && (
				<div className='pointer-events-none absolute inset-0 z-1001 flex items-center justify-center bg-white/60 text-sm text-zinc-600 dark:bg-black/60 dark:text-zinc-300'>
					<span className='flex items-center gap-2'>
						<span className='h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent' />
						Loading submissions…
					</span>
				</div>
			)}

			{status === 'error' && (
				<div className='absolute inset-x-0 top-0 z-1001 flex justify-center p-3'>
					<div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'>
						{error}
					</div>
				</div>
			)}
		</div>
	);
}
