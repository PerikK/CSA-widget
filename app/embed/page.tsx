'use client';

import { useCallback, useState } from 'react';
import MapLoader from '@/components/MapLoader';
import ThemeToggle from '@/components/ThemeToggle';
import Legend from '@/components/Legend';
import type {
	SourceStatus,
	SourceVisibility,
	SubmissionSource,
} from '@/lib/types';

export default function EmbedPage() {
	const [sources, setSources] = useState<Record<
		SubmissionSource,
		SourceStatus
	> | null>(null);
	// TODO: support host-controlled defaults via iframe query params
	// (e.g. ?show=research / ?hide=userGenerated).
	const [visibleSources, setVisibleSources] = useState<SourceVisibility>({
		research: true,
		userGenerated: true,
	});
	const [refreshKey, setRefreshKey] = useState(0);

	const handleRefresh = useCallback(() => {
		setRefreshKey(k => k + 1);
	}, []);

	const toggleSource = useCallback((source: SubmissionSource) => {
		setVisibleSources(prev => ({
			...prev,
			[source]: !prev[source],
		}));
	}, []);

	return (
		<main className='relative h-dvh w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950'>
			<MapLoader
				refreshKey={refreshKey}
				onStatus={setSources}
				visibleSources={visibleSources}
			/>

			<div className='pointer-events-none absolute inset-0 z-1001 p-3'>
				<div className='flex items-start justify-between'>
					<div className='pointer-events-auto'>
						<Legend
							sources={sources}
							visibleSources={visibleSources}
							onToggleSource={toggleSource}
							onRefresh={handleRefresh}
						/>
					</div>
					<div className='pointer-events-auto'>
						<ThemeToggle />
					</div>
				</div>
			</div>
		</main>
	);
}
