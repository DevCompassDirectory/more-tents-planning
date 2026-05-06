import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
	variable: '--font-playfair',
	subsets: ['latin'],
	weight: ['700'],
});

const dmSans = DM_Sans({
	variable: '--font-dm-sans',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
	title: 'More Tents Planning',
	description: 'Interne planningstool voor More Tents BV',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='nl'>
			<body
				className={`${playfair.variable} ${dmSans.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
