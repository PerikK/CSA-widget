import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'CSA Widget',
	description: 'Embeddable map of citizen science submissions',
};

// Set the theme class before React hydrates to avoid a flash of the wrong theme.
const themeScript = `
(function () {
  try {
    var theme = localStorage.getItem("csa-widget-theme") || "system";
    var dark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en' suppressHydrationWarning className='h-full'>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body className='h-full'>{children}</body>
		</html>
	);
}
