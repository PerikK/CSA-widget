import MapLoader from '@/components/MapLoader';
import ThemeToggle from '@/components/ThemeToggle';
import Legend from '@/components/Legend';

export default function EmbedPage() {
	return (
		<main className='relative h-dvh w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950'>
			<MapLoader />

			<div className='pointer-events-none absolute inset-0 z-1001 p-3'>
				<div className='flex items-start justify-between'>
					<div className='pointer-events-auto'>
						<Legend />
					</div>
					<div className='pointer-events-auto'>
						<ThemeToggle />
					</div>
				</div>
			</div>
		</main>
	);
}
