import puppeteer from "puppeteer";
import fs from "fs/promises";
import { brandDataUr } from "./brandData.js";
// import express from "express";
// import cors from "cors";
// import { scraping } from "./controller/scraping.js";

// const app = express();
// app.use(cors());

// app.get("/", scraping);

// app.listen(4000, () => {
//   console.log("server is listening");
// });

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://www.1800d2c.com/locations/usa/", {
    waitUntil: "load",
    timeout: 10000,
  });

  let brandData = [...brandDataUr];
  // console.log(brandData);

  async function getUrlFromCardPage(url) {
    try {
      if (!url) return null;
      await page.goto(url, { waitUntil: "load", timeout: 60000 });
      await page.waitForSelector("a.bxl", { visible: true, timeout: 120000 });
      return await page.$eval("a.bxl", (el) => el.href);
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
      brandData.push(...brands);

      // const bradNameWithUrl = await Promise.all(
      //   brands.map(async (brand) => {
      //     if (brand.nextPageUrl) {
      //       const brandUrl = await getUrlFromCardPage(brand.nextPageUrl);
      //       return {
      //         brandName: brand.brandName,
      //         cardPageLink: brand.nextPageUrl,
      //         brandUrl,
      //       };
      //     }
      //     return {
      //       brandName: brand.brandName,
      //       brandUrl: null,
      //     };
      //   })
      // );

      // brandData.push(...bradNameWithUrl);
    } catch (error) {
      console.error("Error scraping current page:", error);
      return null;
    }
  }

  // await scrapeCurrentPage();

  let hasNext = true;
  let pageNo = 1;

  // while (hasNext) {
  //   let selector = ".w-pagination-next";
  //   await page.waitForSelector(selector);
  //   const nextPageLink = await page.evaluate((selector) => {
  //     const element = document.querySelector(selector);
  //     if (!element) return false;
  //     const style = window.getComputedStyle(element);
  //     return style && style.display !== "none";
  //   }, selector);
  //   if (nextPageLink) {
  //     console.log("Page no", ++pageNo);
  //     const link = await page.$eval(selector, (el) => el.href);
  //     await page.goto(link);
  //     await scrapeCurrentPage();
  //   } else {
  //     hasNext = false;
  //     console.log("no next page");
  //   }
  // }

  let result = [];
  let productNo = 1;

  for (let brand of brandData) {
    const brandUrl = await getUrlFromCardPage(brand.nextPageUrl);
    console.log("Product No: ", productNo++);
    result.push({
      brandName: brand.brandName,
      cardPageLink: brand.nextPageUrl,
      brandUrl,
    });
  }

  try {
    await fs.writeFile("scrapped_file.json", JSON.stringify(result, null, 2));
    console.log(
      "Brand data has been successfully written to scrapped_file.json"
    );
  } catch (error) {
    console.error("Error writing file:", error);
  }

  console.log(result);
  await browser.close();
})();
