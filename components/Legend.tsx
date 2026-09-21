import { ASSESSMENT_META } from '@/lib/assessment';

function formatUpdatedAt(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function Legend({
	updatedAt,
	onRefresh,
}: {
	updatedAt: string | null;
	onRefresh: () => void;
}) {
	return (
		<div className='rounded-lg border border-zinc-200 bg-white/90 px-2 py-1.5 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90'>
			<div className='text-sm font-semibold pb-1.5'>
				Overall Assessment
			</div>
			<div className='flex flex-col gap-1 text-[11px] text-zinc-700 dark:text-zinc-200'>
				{(['good', 'moderate', 'poor'] as const).map(key => (
					<div key={key} className='flex items-center gap-1.5'>
						<span
							className='h-2.5 w-2.5 rounded-full'
							style={{ backgroundColor: ASSESSMENT_META[key].color }}
						/>
						{ASSESSMENT_META[key].label}
					</div>
				))}
			</div>
			<div className='mt-1.5 flex items-center justify-between gap-2 border-t border-zinc-200 pt-1.5 dark:border-zinc-700'>
				<span className='text-[11px] text-zinc-500 dark:text-zinc-400'>
					Updated: {updatedAt ? formatUpdatedAt(updatedAt) : '—'}
				</span>
				<button
					type='button'
					onClick={onRefresh}
					className='flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
				>
					<svg
						viewBox='0 0 24 24'
						className='h-3 w-3'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
					>
						<path d='M21 12a9 9 0 1 1-2.64-6.36' />
						<path d='M21 3v6h-6' />
					</svg>
					Refresh
				</button>
			</div>
		</div>
	);
}
