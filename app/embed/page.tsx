'use client';

import { useCallback, useState } from 'react';
import MapLoader from '@/components/MapLoader';
import ThemeToggle from '@/components/ThemeToggle';
import Legend from '@/components/Legend';

export default function EmbedPage() {
	const [updatedAt, setUpdatedAt] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleRefresh = useCallback(() => {
		setRefreshKey(k => k + 1);
	}, []);

	return (
		<main className='relative h-dvh w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950'>
			<MapLoader refreshKey={refreshKey} onUpdatedAt={setUpdatedAt} />

			<div className='pointer-events-none absolute inset-0 z-1001 p-3'>
				<div className='flex items-start justify-between'>
					<div className='pointer-events-auto'>
						<Legend updatedAt={updatedAt} onRefresh={handleRefresh} />
					</div>
					<div className='pointer-events-auto'>
						<ThemeToggle />
					</div>
				</div>
			</div>
		</main>
	);
}
