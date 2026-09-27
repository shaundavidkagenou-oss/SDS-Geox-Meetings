import { BoardElement, BoardState } from '../types';

export function exportBoardAsJson(state: BoardState, filename = 'sds-geox-board.json') {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSvgElementAsSvg(svgElement: SVGSVGElement, filename = 'sds-geox-whiteboard.svg') {
  // Clone svg to remove transforms or cursors if needed
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Remove cursor layers or transient markers
  const cursors = clone.querySelectorAll('.remote-cursor, .laser-trail, .selection-overlay');
  cursors.forEach((c) => c.remove());

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(clone);

  // Add namespaces if missing
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportSvgElementAsPng(
  svgElement: SVGSVGElement,
  filename = 'sds-geox-whiteboard.png',
  transparent = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      const cursors = clone.querySelectorAll('.remote-cursor, .laser-trail, .selection-overlay');
      cursors.forEach((c) => c.remove());

      const rect = svgElement.getBoundingClientRect();
      const width = Math.max(rect.width, 1920);
      const height = Math.max(rect.height, 1080);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; // 2x retina clarity
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URLObj.revokeObjectURL(blobURL);
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.scale(scale, scale);

        if (!transparent) {
          ctx.fillStyle = '#0a0d14'; // dark theme canvas bg
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URLObj.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            a.click();
            URLObj.revokeObjectURL(downloadUrl);
            URLObj.revokeObjectURL(blobURL);
            resolve();
          } else {
            URLObj.revokeObjectURL(blobURL);
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };

      image.onerror = (err) => {
        URLObj.revokeObjectURL(blobURL);
        reject(err);
      };

      image.src = blobURL;
    } catch (e) {
      reject(e);
    }
  });
}
