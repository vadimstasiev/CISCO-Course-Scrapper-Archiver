const { config } = require('./netacad-config');

const scrapingActions = [
    {
        url: 'https://www.netacad.com/portal/saml_login',
        async scraper(browser) {
            let page = await browser.newPage();
            console.log(`Navigating to ${this.url}...`);
            // Navigate to the selected page
            await page.goto(this.url, {waitUntil: 'networkidle2'});

            // Email input
            const emailInputXPath = '//*[@id="email"]';
            const nextButtonXPath = '//*[@id="btn"]';
            await page.waitForXPath(emailInputXPath);
            const [emailInputHandle] = await page.$x(emailInputXPath);
            const [nextButtonHandle] = await page.$x(nextButtonXPath);

            await page.evaluate(async (inputEl, nextButtonEl, email) => {
                inputEl.value = email;
                nextButtonEl.disabled = false;
                setTimeout(()=>{
                    console.log('waiting');
                }, 1000)
            }, emailInputHandle, nextButtonHandle, config.creds.email);

            await Promise.all([
                nextButtonHandle.click(),
                page.waitForNavigation({ waitUntil: 'networkidle0' }),
            ])


            // Password Input
            const passwordInputXPath = '//*[@id="password"]';
            const signinButtonXPath = '//*[@id="kc-login"]';
            await page.waitForXPath(passwordInputXPath);
            const [passwordInputHandle] = await page.$x(passwordInputXPath);
            const [signinButtonHandle] = await page.$x(signinButtonXPath);
            
            await page.evaluate(async (inputEl, nextButtonEl, password) => {
                inputEl.value = password;
                nextButtonEl.disabled = false;
                setTimeout(()=>{
                    console.log('waiting');
                }, 1000)
            }, passwordInputHandle, signinButtonHandle, config.creds.password);
            
            await Promise.all([
                signinButtonHandle.click(),
                page.waitForNavigation({ waitUntil: 'networkidle0' }),
            ])
            
            const portalLogoXPath = '/html/body/header/div/div[1]/a/div/img';
            await page.waitForXPath(portalLogoXPath);           

            console.log("Login Complete!");
            page.close();
        }
    },
    {
        url: config.course_url,
        async scraper(browser){
            let page = await browser.newPage();
            console.log(`Navigating to ${this.url}...`);
            // Navigate to the course url that has the button to load the course
            await page.goto(this.url, {waitUntil: 'networkidle2'});
            const loadModuleButtonXPath = '//*[@id="tool_form"]/div/div[1]/div/button';
            await page.waitForXPath(loadModuleButtonXPath);
            const [loadModuleButtonHandle] = await page.$x(loadModuleButtonXPath);

            await loadModuleButtonHandle.click();

            let pages = await browser.pages();
            const lastPage = pages.length;  

            
            // switch to last tab in the browser as the course is loaded in a new tab

            console.log(lastPage)
            page = await pages[lastPage-1];
            // console.log(page);
            console.log(pages)

            // await page.waitForNavigation({ waitUntil: 'networkidle0' })

            const courseLogoXPath = '//*[@id="root"]/header/div/a/span';
            // await page.waitForXPath(courseLogoXPath);    
            console.log("Course Loaded!");

            setTimeout(()=>{
                console.log('waiting');
            }, 10000)

            console.log(browser.pages())

            // Scrape the course
            const data = await page.evaluate(() => {
                console.log("what the fuck")
                const content = Array.from(document.querySelectorAll('h1 h2 p'))
                return tds.map(td => {
                   var txt = td.innerHTML;
                   return txt.replace(/<a [^>]+>[^<]*<\/a>/g, '').trim();
                });
            });
            console.log(data)
        }
    }
]

module.exports = scrapingActions;