fs = require('fs');
const { config } = require('./netacad-config');
const { download, uuidv4 } = require('./helpers');

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
        url: config.course_button_url,
        async scraper(browser){
            let page = await browser.newPage();
            console.log(`Navigating to ${this.url}...`);
            // Navigate to the course url that has the button to load the course
            await page.goto(this.url, {waitUntil: 'networkidle2'});
            const loadModuleButtonXPath = '//*[@id="tool_form"]/div/div[1]/div/button';
            await page.waitForXPath(loadModuleButtonXPath);
            const [loadModuleButtonHandle] = await page.$x(loadModuleButtonXPath);

            await loadModuleButtonHandle.click();

            // await page.waitForNavigation({ waitUntil: 'networkidle0' })

            console.log(`Navigating to ${config.course_url}...`);
            // Navigate to the course url that has the button to load the course
            await page.goto(config.course_url, {waitUntil: 'networkidle2'});

            page.bringToFront();

            const courseLogoXPath = '//*[@id="root"]/header/div/a/span';
            await page.waitForXPath(courseLogoXPath);    
            console.log("Course Loaded!");

            // // Scrape the course
            // const data = await page.evaluate(() => {
            //     // better try to iterate individually, find image/video sources, download them, change source code to point to them
            //     let allContent;
            //     document.querySelectorAll('.chunk').forEach(container => {
            //         allContent += container.innerHTML;
            //     })
            // });
            // console.log(data)

            const contentChunksXPath = '//*[@id="chunks-container"]';
            await page.waitForXPath(contentChunksXPath);
            const [contentChunksHandle] = await page.$x(contentChunksXPath);

            // Get images inside parent "chunks-container" 
            const imagesHref = await contentChunksHandle.evaluate(() => {
                let elements = Array.from(document.querySelectorAll('img'));
                return elements.map(element => element.src);
            });
            const image_names = [];
            // Download every image
            for(const image of imagesHref) {
                const image_name = `${uuidv4()}.${image.split('.').pop()}`
                image_names.push(image_name);
                result = await download(image, `./output/IMG/${image_name}`);
            }
            // Replace the source on images of the html to point to the downloaded ones
            await contentChunksHandle.evaluate(() => {
                let elements = Array.from(document.querySelectorAll('img'));
                elements.map((element, i) => {
                    element.src = `.IMG/${element.src}`
                });
            });
            
            // Save SVGs

            // Get all inner html of content-chunks

            // const pageOutput = await contentChunksHandle.evaluate(() => {
            //     // document.forEach(container => {
            //     //     const txt = container.innerHTML;
            //     //     console.log(txt);
            //     // })
            //     return document.querySelector("*").innerHTML;
            // });

            const pageOutput = await page.evaluate(() => {
                let allContent;
                document.querySelectorAll('.chunk').forEach(container => {
                    allContent += container.innerHTML;
                })
                return allContent;
            });

            // console.log(pageOutput)
            fs.writeFile('./output/output.md', pageOutput, (err) => {
                if (err) return console.log(err);
                console.log('File saved!');
            });
            

            // let pages = await browser.pages();
            // const lastPage = pages.length;  

            
            // switch to last tab in the browser as the course is loaded in a new tab



            // console.log(lastPage)
            // page = await pages[lastPage-1];
            // // console.log(page);
            // console.log(pages)

            // await page.waitForNavigation({ waitUntil: 'networkidle0' })

            // const courseLogoXPath = '//*[@id="root"]/header/div/a/span';
            // // await page.waitForXPath(courseLogoXPath);    
            // console.log("Course Loaded!");

            // setTimeout(()=>{
            //     console.log('waiting');
            // }, 10000)

            // console.log(browser.pages())

            // // Scrape the course
            // const data = await page.evaluate(() => {
            //     console.log("what the fuck")
            //     const content = Array.from(document.querySelectorAll('h1 h2 p'))
            //     return tds.map(td => {
            //        var txt = td.innerHTML;
            //        return txt.replace(/<a [^>]+>[^<]*<\/a>/g, '').trim();
            //     });
            // });
            // console.log(data)
        }
    }
]

module.exports = scrapingActions;