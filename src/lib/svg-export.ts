// Serialize an on-screen SVG chart to a downloadable PNG.
//
// Our charts paint via Tailwind classes (CSS rules, not inline attributes), which
// vanish once the SVG is detached from the document. So we copy the *computed* paint
// styles onto a clone, and detect the card's background so dark-theme exports stay legible.

const STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linejoin',
  'opacity',
  'font-size',
  'font-family',
  'font-weight',
  'text-anchor',
];

const inlineStyles = (source: Element, clone: Element) => {
  const computed = getComputedStyle(source);
  let declaration = '';
  for (const prop of STYLE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (value) declaration += `${prop}:${value};`;
  }
  clone.setAttribute('style', declaration);

  const sourceChildren = source.children;
  const cloneChildren = clone.children;
  for (let i = 0; i < sourceChildren.length; i += 1) {
    inlineStyles(sourceChildren[i], cloneChildren[i]);
  }
};

/** Walk up from the SVG to the first element with an opaque background (the card). */
const resolveBackground = (svg: SVGSVGElement): string => {
  let element: Element | null = svg;
  while (element) {
    const color = getComputedStyle(element).backgroundColor;
    if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') return color;
    element = element.parentElement;
  }
  return '#ffffff';
};

/** Render `svg` to a PNG and trigger a download. */
export const exportSvgToPng = async (svg: SVGSVGElement, filename: string, scale = 2) => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);

  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || svg.clientWidth || 800;
  const height = viewBox.height || svg.clientHeight || 300;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const serialized = new XMLSerializer().serializeToString(clone);
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to render chart image'));
    image.src = source;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = resolveBackground(svg);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  downloadCanvas(canvas, filename);
};

/** Download an already-rendered canvas (used directly by the canvas-based scatter). */
export const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};
