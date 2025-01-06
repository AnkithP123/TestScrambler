import './webfontloader';
import 'canvas-latex';


const canvas: HTMLCanvasElement = document.createElement('canvas');

const getParameterByName = (name: string): string | null => {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const options = {
  displayMode: JSON.parse(getParameterByName('displayMode') || 'true'),
  debugBounds: JSON.parse(getParameterByName('debugBounds') || 'false'),
};

const widget = new (window as any).CanvasLatex.default('', options);
(window as any).widget = widget;
const stage = new (window as any).createjs.Stage(canvas);
stage.addChild(widget);

// grab the width and height from canvas
const height = canvas.getAttribute('height') || '0';
const width = canvas.getAttribute('width') || '0';
// reset the canvas width and height with window.devicePixelRatio applied
canvas.setAttribute('width', Math.round(parseInt(width) * window.devicePixelRatio).toString());
canvas.setAttribute('height', Math.round(parseInt(height) * window.devicePixelRatio).toString());
// force the canvas back to the original size using css
canvas.style.width = width + 'px';
canvas.style.height = height + 'px';
// set CreateJS to render scaled
stage.scaleX = stage.scaleY = window.devicePixelRatio;

const input = document.getElementById('input') as HTMLInputElement;
input.oninput = updateWidget;

(window as any).WebFont.load({
  custom: {
    families: [
      'KaTeX_AMS:n4,i4,n7',
      'KaTeX_Caligraphic:n4,i4,n7',
      'KaTeX_Fraktur:n4,i4,n7',
      'KaTeX_Main:n4,i4,n7',
      'KaTeX_Math:n4,i4,n7',
      'KaTeX_SansSerif:n4,i4,n7',
      'KaTeX_Script:n4,i4,n7',
      'KaTeX_Typewriter:n4,i4,n7',
      'KaTeX_Main-BoldItalic:n4,i4,n7',
      'KaTeX_Math-BoldItalic:n4,i4,n7',
      'KaTeX_Size1:n4',
      'KaTeX_Size2:n4',
      'KaTeX_Size3:n4',
      'KaTeX_Size4:n4',
      'Math_SansSerif',
    ],
    testStrings: {
      'KaTeX_Size1': '()[]',
      'KaTeX_Size2': '()[]',
      'KaTeX_Size3': '()[]',
      'KaTeX_Size4': '()[]'
    }
  },
  active: () => {
    window.document.body.classList.add('web-font-loaded');
  }
});

function updateWidget(): void {
  widget.latex = input.value;
  redraw();
}

function redraw(): void {
  const bounds = widget.getBounds();
  if (bounds) {
    widget.set({ x: -bounds.x, y: 10 - bounds.y });
  }
  stage.update();
}

(window as any).redraw = redraw;
(window as any).updateWidget = updateWidget;

function downloadCanvasAsImage(canvas: HTMLCanvasElement): { imageData2: string, trimmedCanvas: HTMLCanvasElement } {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');

    const trimmedCanvas = document.createElement('canvas');
    const trimmedCtx = trimmedCanvas.getContext('2d');
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    
    if (imageData && trimmedCtx) {
      let top = 0;
      let bottom = imageData.height;

      // Find the top boundary
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
          if (alpha > 0) {
            top = y;
            break;
          }
        }
        if (top > 0) break;
      }

      // Find the bottom boundary
      for (let y = imageData.height - 1; y >= 0; y--) {
        for (let x = 0; x < imageData.width; x++) {
          const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
          if (alpha > 0) {
            bottom = y;
            break;
          }
        }
        if (bottom < imageData.height) break;
      }

      const trimmedHeight = bottom - top + 1;
      trimmedCanvas.width = canvas.width;
      trimmedCanvas.height = trimmedHeight;
      trimmedCtx.putImageData(imageData, 0, -top);
    }

    const imageData2 = trimmedCanvas.toDataURL('image/png');

    return {
        imageData2,
        trimmedCanvas
    }
}

export default function renderLatexToImage2(latexString: string): { imageData2: string, trimmedCanvas: HTMLCanvasElement } {
    widget.latex = latexString;

    redraw();

    // Download the canvas as an image
    return downloadCanvasAsImage(canvas);
}
