'use client';

import * as pdfjsLib from 'pdfjs-dist';

let workerInitialized = false;

function initWorker() {
	if (workerInitialized) return;
	pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
	workerInitialized = true;
}

export async function extractPdfText(file: File): Promise<string> {
	initWorker();

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
