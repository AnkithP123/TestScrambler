const katex = require('katex');

// Function to render LaTeX and save as SVG
export default async function latexToSvg(latexString, outputPath) {
    // Render LaTeX string to HTML
    const latexHtml = katex.renderToString(latexString, {
        throwOnError: false,
        displayMode: true,
    });

    // Create SVG data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(latexHtml).toString('base64')}`;

    // Extract SVG content from data URL
    const svgContent = Buffer.from(svgDataUrl.split(',')[1], 'base64').toString('utf-8');

    // Save the SVG content to a file
    return svgContent;
}

