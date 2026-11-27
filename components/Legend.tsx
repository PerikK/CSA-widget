import { ASSESSMENT_META } from '@/lib/assessment';
import { PIN_PATH, PIN_VIEWBOX } from '@/lib/markers';
import type {
	SourceStatus,
	SourceVisibility,
	SubmissionSource,
} from '@/lib/types';

const SOURCE_ORDER: SubmissionSource[] = ['research', 'userGenerated'];

const SOURCE_LABELS: Record<SubmissionSource, string> = {
	research: 'Research sites',
	userGenerated: 'User-generated sites',
};

const SOURCE_SHORT_LABELS: Record<SubmissionSource, string> = {
	research: 'Research',
	userGenerated: 'User-generated',
};

const SOURCE_DISPLAY_LABELS: Record<SubmissionSource, string> = {
	research: 'Research Site',
	userGenerated: 'User Generated',
};

const MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

function formatTime(iso: string | null): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatDateTime(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const dd = String(d.getDate()).padStart(2, '0');
	const month = MONTHS[d.getMonth()];
	const yyyy = d.getFullYear();
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	return `${dd}-${month}-${yyyy} ${hh}:${mm}`;
}

function sourceWarnings(
	sources: Record<SubmissionSource, SourceStatus> | null,
): string[] {
	if (!sources) return [];

	return SOURCE_ORDER.filter(source => !sources[source].ok).map(
		source => {
			const label = `${SOURCE_LABELS[source]} list`;
			const { updatedAt } = sources[source];
			return updatedAt
				? `${label} could not be updated. Showing last known data from ${formatDateTime(updatedAt)}. Please refresh.`
				: `${label} could not be retrieved. Please refresh.`;
		},
	);
}

function EyeIcon() {
	return (
		<svg
			viewBox='0 0 24 24'
			className='h-3.5 w-3.5 shrink-0'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z' />
			<circle cx='12' cy='12' r='3' />
		</svg>
	);
}

function EyeOffIcon() {
	return (
		<svg
			viewBox='0 0 24 24'
			className='h-3.5 w-3.5 shrink-0'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z' />
			<circle cx='12' cy='12' r='3' />
			<path d='M3 3l18 18' />
		</svg>
	);
}

function ExternalLinkIcon() {
	return (
		<svg
			viewBox='0 0 24 24'
			className='h-3 w-3 shrink-0'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<path d='M14 3h7v7' />
			<path d='M10 14 21 3' />
			<path d='M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5' />
		</svg>
	);
}

export default function Legend({
	sources,
	visibleSources,
	onToggleSource,
	onRefresh,
}: {
	sources: Record<SubmissionSource, SourceStatus> | null;
	visibleSources: SourceVisibility;
	onToggleSource: (source: SubmissionSource) => void;
	onRefresh: () => void;
}) {
	const warnings = sourceWarnings(sources);

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
			<div className='mt-1.5 border-t border-zinc-200 pt-1.5 dark:border-zinc-700'>
				<div className='text-[11px] font-medium text-zinc-500 dark:text-zinc-300'>
					Site type
				</div>
				<div className='mt-1 flex flex-col gap-1 text-[11px] text-zinc-700 dark:text-zinc-200'>
					{SOURCE_ORDER.map(source => {
						const visible = visibleSources[source];
						const label = SOURCE_DISPLAY_LABELS[source];
						return (
							<button
								key={source}
								type='button'
								onClick={() => onToggleSource(source)}
								aria-pressed={visible}
								aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
								title={`${visible ? 'Hide' : 'Show'} ${label}`}
								className='flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-500'
							>
								<span
									className={`flex items-center gap-1.5 ${
										visible ? '' : 'opacity-50'
									}`}
								>
									{source === 'research' ? (
										<span className='h-2.5 w-2.5 rounded-full border border-zinc-500' />
									) : (
										<svg
											viewBox={PIN_VIEWBOX}
											className='h-3.75 w-2.5 shrink-0'
											fill='currentColor'
											aria-hidden='true'
										>
											<path d={PIN_PATH} />
										</svg>
									)}
									{label}
								</span>
								{visible ? <EyeIcon /> : <EyeOffIcon />}
							</button>
						);
					})}
				</div>
			</div>
			<div className='mt-1.5 flex items-center justify-between gap-2 border-t border-zinc-200 pt-1.5 dark:border-zinc-700'>
				<div className='text-[11px] text-zinc-500 dark:text-zinc-400'>
					<div>Updated:</div>
					{SOURCE_ORDER.map(source => (
						<div key={source}>
							{SOURCE_SHORT_LABELS[source]}:{' '}
							{formatTime(sources ? sources[source].updatedAt : null)}
						</div>
					))}
				</div>
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
			{warnings.length > 0 && (
				<div
					role='status'
					aria-live='polite'
					className='mt-1.5 max-w-68 border-t border-zinc-200 pt-1.5 text-[11px] leading-snug text-amber-600 dark:border-zinc-700 dark:text-amber-400'
				>
					{warnings.map(warning => (
						<div key={warning}>{warning}</div>
					))}
				</div>
			)}
			<div className='mt-1.5 border-t border-zinc-200 pt-1.5 dark:border-zinc-700'>
				<div className='flex flex-col gap-1 text-[11px]'>
					<a
						href='https://www.oneaquahealth.eu'
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex w-fit items-center gap-1 font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-500'
					>
						Go to OneAquaHealth Hub
						<span className='sr-only'> (opens in a new tab)</span>
						<ExternalLinkIcon />
					</a>
					<a
						href='https://www.oneaquahealth.eu/project-solutions/'
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex w-fit items-center gap-1 font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-500'
					>
						Go to OneAquaHealth Solutions
						<span className='sr-only'> (opens in a new tab)</span>
						<ExternalLinkIcon />
					</a>
				</div>
			</div>
		</div>
	);
}
