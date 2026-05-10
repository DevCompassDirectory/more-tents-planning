'use client';

let workerInitialized = false;
let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;

function loadPdfjs() {
	if (!pdfjsLibPromise) {
		pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then(
			(lib) => {
				if (!workerInitialized) {
					lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
					workerInitialized = true;
				}
				return lib as unknown as typeof import('pdfjs-dist');
			},
		);
	}
	return pdfjsLibPromise;
}

export async function extractPdfText(file: File): Promise<string> {
	console.log('[PDF] Start:', file.name, file.size, 'bytes');

	try {
		const pdfjsLib = await loadPdfjs();
		console.log('[PDF] Library geladen, versie:', pdfjsLib.version);

		const arrayBuffer = await file.arrayBuffer();
		console.log('[PDF] ArrayBuffer:', arrayBuffer.byteLength, 'bytes');

		const pdf = await pdfjsLib.getDocument({
			data: arrayBuffer,
		}).promise;
		console.log('[PDF] Document geopend, paginas:', pdf.numPages);

		let text = '';
		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i);
			const stream = page.streamTextContent({
				includeMarkedContent: false,
				disableNormalization: false,
			});
			const reader = stream.getReader();
			let pageText = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				pageText +=
					value.items
						.map((x: any) => ('str' in x ? x.str : ''))
						.join(' ') + ' ';
			}
			text += pageText + '\n';
			console.log('[PDF] Pagina', i, 'klaar');
		}
		return text;
	} catch (err) {
		console.error('[PDF] FOUT:', err);
		throw err;
	}
}
