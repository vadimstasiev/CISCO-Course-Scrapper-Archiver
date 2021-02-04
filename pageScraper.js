fs = require('fs');
const { config } = require('./netacad-config');
const { download, uuidv4, get_url_extension, sleep } = require('./helpers');

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

            // Just to be safe
            sleep(1);

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
            
            // Just to be safe
            sleep(1);

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
            // Create storage dir if not exist
            var dir = './output';
            var dir_img = `${dir}/IMG`
            var dir_svg = `${dir}/SVG`

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            if (!fs.existsSync(dir_img)){
                fs.mkdirSync(dir_img);
            }
            if (!fs.existsSync(dir_svg)){
                fs.mkdirSync(dir_svg);
            }

            let page = await browser.newPage();
            console.log(`Navigating to ${this.url}...`);
            // Navigate to the course url that has the button to load the course
            await page.goto(this.url, {waitUntil: 'networkidle2'});
            const loadModuleButtonXPath = '//*[@id="tool_form"]/div/div[1]/div/button';
            await page.waitForXPath(loadModuleButtonXPath);
            const [loadModuleButtonHandle] = await page.$x(loadModuleButtonXPath);

            await loadModuleButtonHandle.click();


            console.log(`Navigating to ${config.course_url}...`);
            // Navigate to the course url that has the button to load the course
            await page.goto(config.course_url, {waitUntil: 'networkidle2'});

            sleep(3);

            page.bringToFront();

            let pageCount = 0;
            const contentChunksXPath = '//*[@id="chunks-container"]';

            while(true) {
                while(true){
                    try{
                        if(await page.waitForXPath(contentChunksXPath)){break;}
                    } catch {}
                }
                const [contentChunksHandle] = await page.$x(contentChunksXPath);





                // Get array of image urls from inside parent "chunks-container" 
                const imagesHref = await contentChunksHandle.evaluate(() => {
                    let elements = Array.from(document.querySelectorAll('img'));
                    return elements.map(element => element.src);
                });
                const image_names = [];
                // Download every image, imagesHref = array with urls
                for(const image of imagesHref) {
                    const image_name = `${uuidv4()}.${get_url_extension(image)}`
                    image_names.push(image_name);
                    // you can await download if you get JavaScript heap out of memory
                    download(image, `${dir_img}/${image_name}`);
                    
                }
                // Replace the source on images of the html to point to the downloaded ones
                // Note: aparently the first parameter is something else, possibly contentChunksHandle
                await contentChunksHandle.evaluate((_, image_names) => {
                    let elements = Array.from(document.querySelectorAll('img'));
                    elements.map((element, i) => {
                        element.src = `IMG/${image_names[i]}`
                    });
                }, image_names);
                
                // Get array of SVG elements from inside parent "chunks-container" 
                const svgPack = await contentChunksHandle.evaluate(() => {
                    // Exposing function
                    const uuidv4 = () => {
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                          return v.toString(16);
                        });
                    }
                    // Getting all SVGs
                    let elements = Array.from(document.querySelectorAll('svg'));
                    return elements.map(element => {
                        element.setAttribute("xmlns","http://www.w3.org/2000/svg")
                        const data = element.outerHTML;
                        const name = uuidv4() + ".svg"
                        return {name, data};
                    });
                }, );

                // Generate SVG Files
                svgPack.map(svg => {
                    fs.writeFile(`${dir_svg}/${svg.name}`, svg.data, (err) => {
                        if (err) return console.log(err);
                        console.log(`${svg.name} saved!`);
                    });
                })

                await contentChunksHandle.evaluate((_, image_names) => {
                    let elements = Array.from(document.querySelectorAll('svg'));
                    elements.map((element, i) => {
                        element.src = `IMG/${image_names[i]}`
                    });
                }, image_names);

                // Save Videos
    
    
                // Get all inner html of content-chunks
    
                const pageOutput = await page.evaluate(() => {
                    let allContent;
                    document.querySelectorAll('.chunk').forEach(container => {
                        allContent += container.innerHTML;
                    })
                    return allContent;
                });
    
                // console.log(pageOutput);String(pageCount).padStart(3, '0')
                fs.writeFile(`${dir}/${String(pageCount).padStart(3, '0')}.md`, pageOutput, (err) => {
                    if (err) return console.log(err);
                    console.log(`File ${String(pageCount).padStart(3, '0')}.md saved!`);
                });

                // find next button then click if not break icon-right-arrow
                const nextButtonXPath = '//*[@class="icon-right-arrow"]';
                let nextButtonHandle;
                while(true){
                    await page.waitForXPath(nextButtonXPath);
                    [nextButtonHandle] = await page.$x(nextButtonXPath);
                    if(nextButtonHandle){break;}
                }
                await nextButtonHandle.click();
                // await page.waitForNavigation({ waitUntil: 'networkidle0' })
                await sleep(1)

                pageCount++;
            }
        }
    }
]

module.exports = scrapingActions;