import puppeteer from 'puppeteer';

export const generatePdf = async (html) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Configura el contenido HTML de la página
    await page.setContent(html);

    // Genera el PDF y obtén su buffer
    const pdfBuffer = await page.pdf();

    // Cierra el navegador
    await browser.close();

    return pdfBuffer;
};

