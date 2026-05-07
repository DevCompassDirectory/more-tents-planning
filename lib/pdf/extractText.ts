'use client';

let workerInitialized = false;
let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;

function ensurePolyfills() {
	// Safari < 17.4 mist Promise.withResolvers, pdfjs-dist 4+ heeft dat nodig
	if (typeof Promise.withResolvers === 'undefined') {
		Promise.withResolvers = function <T>() {
			let resolve!: (value: T | PromiseLike<T>) => void;
			let reject!: (reason?: unknown) => void;
			const promise = new Promise<T>((res, rej) => {
				resolve = res;
				reject = rej;
			});
			return { promise, resolve, reject };
		};
	}
}

function loadPdfjs() {
	if (!pdfjsLibPromise) {
		ensurePolyfills();
		pdfjsLibPromise = import('pdfjs-dist').then((lib) => {
			if (!workerInitialized) {
				lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
				workerInitialized = true;
			}
			return lib;
		});
	}
	return pdfjsLibPromise;
}

export async function extractPdfText(file: File): Promise<string> {
	const pdfjsLib = await loadPdfjs();

	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

	let text = '';
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const content = await page.getTextContent();
		text +=
			content.items.map((x) => ('str' in x ? x.str : '')).join(' ') +
			'\n';
	}

	return text;
}
