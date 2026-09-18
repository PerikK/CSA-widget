import { ASSESSMENT_META } from '@/lib/assessment';

export default function Legend() {
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
		</div>
	);
}
