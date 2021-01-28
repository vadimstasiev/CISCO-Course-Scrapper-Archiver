const { config } = require('./netacad-config');

const scraperObject = {
    url: 'https://www.netacad.com/portal/saml_login',
    async scraper(browser){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        // Navigate to the selected page
        await page.goto(this.url, {waitUntil: 'networkidle2'});

        // Email input
        let emailInputXPath = '//*[@id="email"]';
        let nextButtonXPath = '//*[@id="btn"]';
        await page.waitForXPath(emailInputXPath);
        const [emailInputHandle] = await page.$x(emailInputXPath);
        const [nextButtonHandle] = await page.$x(nextButtonXPath);

        await page.evaluate(async (inputEl, nextButtonEl, email) => {
            inputEl.value = email;
            nextButtonEl.disabled = false;
            setTimeout(()=>{
                console.log('waiting');
            }, 2000)
            // nextButtonEl.click();
        }, emailInputHandle, nextButtonHandle, config.creds.email);

        await Promise.all([
            nextButtonHandle.click(),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ])


        // Password Input
        let passwordInputXPath = '//*[@id="password"]';
        let signinButtonXPath = '//*[@id="kc-login"]';
        await page.waitForXPath(passwordInputXPath);
        const [passwordInputHandle] = await page.$x(passwordInputXPath);
        const [signinButtonHandle] = await page.$x(signinButtonXPath);

        await page.evaluate(async (inputEl, nextButtonEl, password) => {
            inputEl.value = password;
            nextButtonEl.disabled = false;
            setTimeout(()=>{
                console.log('waiting');
            }, 2000)
            nextButtonEl.click();
        }, passwordInputHandle, signinButtonHandle, config.creds.password);

        console.log("hit the bottom!");
    }
}

module.exports = scraperObject;