const scrapingActions = require('./pageScraper');
const scrapeAll = async browserInstance => {
    let browser;
    try{
        browser = await browserInstance;
        for (let pageScraper of scrapingActions) {
            await pageScraper.scraper(browser);
        }
    }
    catch(err){
        console.log("Could not resolve the browser instance => ", err);
    }
}

module.exports = (browserInstance) => scrapeAll(browserInstance)
