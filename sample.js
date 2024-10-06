import puppeteer from "puppeteer";

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://www.1800d2c.com/locations/usa/");

  let brandData = [];
  async function scrapeCurrentPage() {
    await page.waitForSelector(".cardbrand");
    const brands = await page.$$eval(".cardbrand", (cards) => {
      return cards.map((card) => {
        const brandName = card.querySelector(".cardheader")?.innerText || null;
        const nextPageUrl = card.querySelector("a")?.href || null;
        return { brandName, nextPageUrl };
      });
    });
    brandData.push(...brands);
    // brandData.push(
    //   ...brands.filter((brand) => brand.brandName && brand.nextPageUrl)
    // );
  }
  // Scrape the first page
  await scrapeCurrentPage();

  for (let i = 0; i < 205; i++) {
    console.log(i);
    const selector = ".w-pagination-next";
    await page.waitForSelector(selector, { visible: true });
    const nextLink = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return style && style.display !== "none" && style.visibility !== "hidden";
    }, selector);
    if (nextLink) {
      const link = await page.$eval(selector, (el) => el.href);
      await page.goto(link);
      await scrapeCurrentPage();
    }
  }
  console.log("loop ended for loop");
  const result = [];
  for (let obj of brandData) {
    console.log("for of loop started");
    await page.goto(obj.nextPageUrl);
    await page.waitForSelector("a.bxl", { visible: true });
    const link = await page.$eval("a.bxl", (el) => el.href);
    result.push({
      brandName: obj.brandName,
      brandLink: link,
    });
  }
  console.log("for of loop ended");

  await browser.close();
  console.log(result);
})();
