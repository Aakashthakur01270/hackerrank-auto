let puppeteer = require("puppeteer");
let cFile = process.argv[2];
let fs = require("fs");
(async function () {
  // browser open => visible 
  

  
  let browser = await puppeteer.launch({
    headless: false,
    slowMo:20,
    defaultViewport: null,

    args: ["--start-maximized"]
  });
  // let page = await browser.newPage();
  let pages = await browser.pages();
  let page = pages[0];

  let data = await fs.promises.readFile(cFile);
  let { url, pwd, user } = JSON.parse(data);
  await page.goto(url, { waitUntil: "networkidle0" },{timeout:0});

  await page.type("#input-1", user);
  await page.type("#input-2", pwd);


//    await page.waitForNavigation({ waitUntil: "networkidle0" }),
    await page.click("button[data-analytics=LoginPassword]")
  
  await page.waitForNavigation({ waitUntil: "networkidle0" },{timeout:0}),
  await page.waitForSelector("a[data-analytics=NavBarProfileDropDown]", { visible: true });
  await page.click("a[data-analytics=NavBarProfileDropDown]");
//   
  await  page.click("a[data-analytics=NavBarProfileDropDownAdministration]")

  await page.waitForSelector(".administration header", { visible: true })
  let tabs = await page.$$(".administration header ul li a");

  let href = await page.evaluate(function (el) {
    return el.getAttribute("href");
  }, tabs[1])
  let mpUrl = "https://www.hackerrank.com" + href;
  console.log(mpUrl);
  await page.goto(mpUrl, { waitUntil: "networkidle0" },{timeout:0});
  

  let qidx = 0;
  while (true) {
    //  => qnumber => question
    let question = await getMeQuestionElement(page, qidx, mpUrl);
    if (question == null) {
      console.log("All Question processed");
      return;
    }
    await handleQuestion(page, question, process.argv[3]);
    qidx++;
  }

})();

async function waitForLoader(page){
    await page.waitForSelector("#ajax-msg",{
        visible:false
    });
}
async function getMeQuestionElement(page, qidx, mpUrl) {
  let pidx = Math.floor(qidx / 10);
  let pQidx = qidx % 10;
  
  console.log(pidx + " " + pQidx);

  await page.goto(mpUrl);
//   await page.waitForNavigation({ waitUntil: "networkidle0" });
  await waitForLoader(page);
  
  await page.waitForSelector(".pagination ul li", { visible: true });
  let paginations = await page.$$(".pagination ul li");
  let nxtBtn = paginations[paginations.length - 2];
  //  attribute
  // class => 
  let className = await page.evaluate(function (el) {
    return el.getAttribute("class")
  }, nxtBtn);
  for (let i = 0; i < pidx; i++) {
    if (className == "disabled") {
      return null;
    }
    await nxtBtn.click();
    //  wait page visible 
    await page.waitForSelector(".pagination ul li", { visible: true });
    //  findElements
    paginations = await page.$$(".pagination ul li");
    nxtBtn = paginations[paginations.length - 2];
    //  attribute
    className = await page.evaluate(function (el) {
      return el.getAttribute("class")
    }, nxtBtn);
  }// pageQuestion
  let challengeList = await page.$$(".backbone.block-center");
  if (challengeList.length > pQidx) {
    return challengeList[pQidx];
  } else {
    return null;
  }
}

async function handleQuestion(page, question, uToAdd) {
  // let qUrl = await page.evaluate(function (el) {
  //   return el.getAttribute("href");
  // }, question);
  // console.log(qUrl);
  // await page.goto(qUrl);
  
  //  backend data 
  // await waitForLoader(page);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" },{timeout:0}), question.click()]);
  await page.waitForSelector("li[data-tab=moderators]", { visible: true })
  await page.click("li[data-tab=moderators]");
  await page.waitForSelector("input[id=moderator]", { visible: true });
  await page.type("#moderator", uToAdd);
  await page.keyboard.press("Enter");
  await page.click(".save-challenge.btn.btn-green")
}