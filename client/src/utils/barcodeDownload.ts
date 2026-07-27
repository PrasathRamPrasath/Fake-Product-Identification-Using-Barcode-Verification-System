export const downloadSvgAsPng = (svg: SVGSVGElement, filename: string) => {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const scale = 3;
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };
  img.src = url;
};

export const printSvg = (svg: SVGSVGElement, title: string) => {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const printWindow = window.open('', '_blank', 'width=420,height=320');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head><title>${title}</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        ${svgString}
        <script>
          window.onload = () => { window.print(); window.onafterprint = () => window.close(); };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
