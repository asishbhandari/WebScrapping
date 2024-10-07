import puppeteer from "puppeteer";
import fs from "fs/promises";

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://www.1800d2c.com/locations/usa/", {
    waitUntil: "load",
    timeout: 0,
  });

  let brandData = [];
  let product = 1;
  async function getUrlFromCardPage(url) {
    try {
      if (!url) return null;
      const cardPage = await browser.newPage();
      await cardPage.goto(url, { waitUntil: "load", timeout: 10000 });
      await cardPage.waitForSelector("a.bxl", {
        visible: true,
        timeout: 60000,
      });
      const result = await cardPage.$eval("a.bxl", (el) => el.href);
      console.log("Product No: ", product++);
      await cardPage.close();
      return result;
    } catch (error) {
      console.error("Error getting url from card page:", error);
      return null;
    }
  }

  async function scrapeCurrentPage() {
    try {
      await page.waitForSelector(".cardbrand");
      const brands = await page.$$eval(".cardbrand", (cards) => {
        return cards.map((card) => {
          const brandName =
            card.querySelector(".cardheader")?.innerText || null;
          const nextPageUrl = card.querySelector("a")?.href || null;
          return { brandName, nextPageUrl };
        });
      });

      const brandDataWithUrl = await Promise.all(
        brands.map(async (brand) => {
          if (brand.nextPageUrl) {
            const brandUrl = await getUrlFromCardPage(brand.nextPageUrl);
            return {
              brandName: brand.brandName,
              brandUrl,
            };
          }
          return {
            brandName: brand.brandName,
            brandUrl: null,
          };
        })
      );

      brandData.push(...brandDataWithUrl);
    } catch (error) {
      console.error("Error scraping current page:", error);
      return null;
    }
  }

  let hasNext = true;
  let pageNo = 1;

  while (hasNext) {
    await scrapeCurrentPage();
    console.log("Page no", pageNo++);

    // Check for the "Next" page button
    let selector = ".w-pagination-next";
    await page.waitForSelector(selector);
    const nextPageLink = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return style && style.display !== "none";
    }, selector);

    if (nextPageLink) {
      const link = await page.$eval(selector, (el) => el.href);
      await page.goto(link, { waitUntil: "load", timeout: 0 }); // Navigate to the next page
    } else {
      hasNext = false;
      console.log("No next page");
    }
  }

  // Write data to JSON file
  try {
    await fs.writeFile(
      "scraped_file_sample.json",
      JSON.stringify(brandData, null, 2)
    );
    console.log(
      "Brand data has been successfully written to scraped_file.json"
    );
  } catch (error) {
    console.error("Error writing file:", error);
  }

  // console.log(brandData);
  await browser.close();
})();
