import type {Worker} from 'tesseract.js';

export type ReadResult = {text: string; pages: number; ocrPages: number; warnings: string[]};
export const MAX_OCR_PAGES = 12;
const cancelled = () => new DOMException('Leitura cancelada.', 'AbortError');

/** Local reading only. Original files are saved separately, before this step. */
export async function readDocument(file: File, progress: (message: string) => void = () => {}, signal?: AbortSignal): Promise<ReadResult> {
  let worker: Worker | undefined;
  let disposed = false;
  let pageLabel = '';
  const warnings: string[] = [];
  let ocrPages = 0;
  function check() {if (signal?.aborted) throw cancelled();}
  async function limited<T>(promise: Promise<T>): Promise<T> {
    check();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: () => void = () => {};
    try {
      return await Promise.race([promise, new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Error('A leitura demorou além do limite. Tente uma imagem mais nítida.')), 120_000);
        onAbort = () => reject(cancelled());
        signal?.addEventListener('abort', onAbort, {once: true});
        if (signal?.aborted) onAbort();
      })]);
    } finally {clearTimeout(timer); signal?.removeEventListener('abort', onAbort);}
  }
  async function recognize(image: HTMLCanvasElement | File): Promise<string> {
    check();
    if (!worker) {
      progress('Preparando a leitura em português…');
      const {createWorker} = await import('tesseract.js');
      const base = new URL(`${import.meta.env.BASE_URL}assets/ocr/`, window.location.origin).href;
      const pending = createWorker('por', 1, {
        workerPath: `${base}worker.min.js`, corePath: base, langPath: base,
        workerBlobURL: false,
        logger: m => {if (!disposed && !signal?.aborted && m.status === 'recognizing text') progress(`${pageLabel} · lendo texto: ${Math.round(m.progress * 100)}%`);},
        // Failures are shown in the document review, not thrown from a worker callback.
        errorHandler: () => {},
      });
      void pending.then(w => {if (disposed) void w.terminate();}).catch(() => {});
      worker = await limited(pending);
    }
    const result = await limited(worker.recognize(image));
    check(); ocrPages++;
    return result.data.text;
  }
  try {
    check();
    if (file.type !== 'application/pdf') {
      pageLabel = 'Foto';
      const text = await recognize(file);
      return {text: `[Página 1]\n${text}`, pages: 1, ocrPages, warnings};
    }
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const pdf = await pdfjs.getDocument({data: await file.arrayBuffer(), isEvalSupported: false}).promise;
    const texts: string[] = [];
    let attemptedOcr = 0;
    let skipped = 0;
    let ocrFailed = false;
    try {
      if (pdf.numPages > 150) throw Error('O limite de leitura é de 150 páginas. Divida o PDF para extrair os dados; o original continua salvo.');
      for (let n = 1; n <= pdf.numPages; n++) {
        check(); pageLabel = `Página ${n} de ${pdf.numPages}`; progress(`${pageLabel} · procurando texto…`);
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        let text = content.items.map(i => 'str' in i ? i.str + (i.hasEOL ? '\n' : ' ') : '').join('');
        if (text.replace(/\s/g, '').length < 50) {
          if (attemptedOcr >= MAX_OCR_PAGES || ocrFailed) skipped++;
          else {
            attemptedOcr++;
            const first = page.getViewport({scale: 1});
            const scale = Math.min(2.5, 1800 / first.width, Math.sqrt(6_000_000 / (first.width * first.height)));
            const viewport = page.getViewport({scale});
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
            try {
              const context = canvas.getContext('2d');
              if (!context) throw Error('Este navegador não conseguiu preparar a imagem da página.');
              await page.render({canvasContext: context, viewport}).promise;
              text = await recognize(canvas);
            } catch (e) {
              if (signal?.aborted) throw cancelled();
              ocrFailed = true;
              warnings.push(`OCR interrompido na página ${n}. Confira essa página e as seguintes manualmente.`);
            } finally {canvas.width = 0; canvas.height = 0;}
          }
        }
        texts.push(`[Página ${n}]\n${text}`); page.cleanup();
      }
      if (skipped) warnings.push(`${skipped} página(s) digitalizada(s) não foram lidas por OCR. O limite por arquivo é de ${MAX_OCR_PAGES} páginas digitalizadas; divida o PDF ou confira o restante manualmente.`);
      return {text: texts.join('\n'), pages: pdf.numPages, ocrPages, warnings};
    } finally {await pdf.destroy();}
  } finally {disposed = true; if (worker) await worker.terminate();}
}

export function readingNote(result: ReadResult): string {
  const text = result.text.replace(/\[Página \d+\]/g, '').trim();
  return [text ? `Leitura de ${result.pages} página(s), ${result.ocrPages} com OCR. Confira todas as sugestões no original.` : 'Nenhum texto legível encontrado. Preencha os campos conferindo o original.', ...result.warnings].join(' ');
}
