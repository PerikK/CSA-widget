'use client';

import dynamic from 'next/dynamic';
import type {
	SourceStatus,
	SourceVisibility,
	SubmissionSource,
} from '@/lib/types';

// Leaflet needs `window`/DOM access, so the map is loaded client-side only.
const Map = dynamic(() => import('./Map'), {
	ssr: false,
	loading: () => (
		<div className='flex h-full w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400'>
			Loading map…
		</div>
	),
});

export default function MapLoader({
	refreshKey,
	onStatus,
	visibleSources,
}: {
	refreshKey: number;
	onStatus: (sources: Record<SubmissionSource, SourceStatus>) => void;
	visibleSources: SourceVisibility;
}) {
	return (
		<Map
			refreshKey={refreshKey}
			onStatus={onStatus}
			visibleSources={visibleSources}
		/>
	);
}
