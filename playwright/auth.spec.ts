import axios from 'axios';
import {Page} from 'playwright';
import {describe, it, expect, beforeEach} from '@playwright/test';

async function seedDb() {
  const testDataApiEndpoint = `http://localhost:3001/testData/seed`;
  const { data } = await axios.post(testDataApiEndpoint);
  return data;
}

async function login(page: Page, username, password, rememberUser) {
  // const signinPath = "/signin";
  await page.goto('http://localhost:3000/signin');
  await page.fill('[data-test=signin-username] >> input', username);
  await page.fill('[data-test=signin-password] >> input', password);
  if (rememberUser) {
    await page.check('[data-test=signin-remember-me] >> input');
  }
  await page.click('[data-test=signin-submit]');
  await page.waitForResponse('http://localhost:3001/login');
}

describe("User Sign-up and Login", () => {

  beforeEach(async () => {
    await seedDb();
  });

  it("should redirect unauthenticated user to signin page", async ({page}) => {
    await page.goto('http://localhost:3000/personal');
    const pathname = await page.evaluate(() => location.pathname);
    expect(pathname).toBe('/signin');
  });

  it("should remember a user for 30 days after login", async ({page}) => {
    // TODO: how to get username?
    await login(page, 'Katharina_Bernier', "s3cret", true);
    const context = await page.context();
    const cookies = await context.cookies();
    const cookie = cookies.find(({name}) => name === 'connect.sid');
    expect(cookie.expires).toBeTruthy();

    // TODO: add mobile
    await page.click('[data-test=sidenav-signout]');
    const pathname = await page.evaluate(() => location.pathname);
    // TODO: remove timeout -- passes on headful
    await page.waitForTimeout(1000);
    expect(pathname).toBe('/signin');
  });

  it("should allow a visitor to sign-up, login, and logout", async ({page}) => {
    const userInfo = {
      firstName: "Bob",
      lastName: "Ross",
      username: "PainterJoy90",
      password: "s3cret",
    };

    // Sign-up User
    await page.goto("http://localhost:3000/");

    // TODO: click to signup fails because element moves
    await page.click('body'); // random click to trigger the move
    await page.click("[data-test=signup]");

    const element = await page.waitForSelector('[data-test=signup-title]');
    expect(element).toBeTruthy(); // checks visibility
    expect(await element.innerText()).toContain('Sign Up');

    await page.fill("[data-test=signup-first-name] >> input", userInfo.firstName);
    await page.fill("[data-test=signup-last-name] >> input", userInfo.lastName);
    await page.fill("[data-test=signup-username] >> input", userInfo.username);
    await page.fill("[data-test=signup-password] >> input", userInfo.password);
    await page.fill("[data-test=signup-confirmPassword] >> input", userInfo.password);

    await page.click("[data-test=signup-submit]");
    await page.waitForResponse("http://localhost:3001/users");

    await login(page, userInfo.username, userInfo.password, false);

    expect(await page.waitForSelector('[data-test=user-onboarding-dialog]')).toBeTruthy(); // checks visibility
    await page.click('[data-test=user-onboarding-next]');

    expect(await page.innerText('[data-test=user-onboarding-dialog-title]')).toContain('Create Bank Account');

    // cy.getBySelLike("bankName-input").type("The Best Bank");
    // cy.getBySelLike("accountNumber-input").type("123456789");
    // cy.getBySelLike("routingNumber-input").type("987654321");
    // cy.percySnapshot("About to complete User Onboarding");
    // cy.getBySelLike("submit").click();

    // cy.wait("@createBankAccount");

    // cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    // cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
    // cy.percySnapshot("Finished User Onboarding");
    // cy.getBySel("user-onboarding-next").click();

    // cy.getBySel("transaction-list").should("be.visible");
    // cy.percySnapshot("Transaction List is visible after User Onboarding");

    // // Logout User
    // if (isMobile()) {
    //   cy.getBySel("sidenav-toggle").click();
    // }
    // cy.getBySel("sidenav-signout").click();
    // cy.location("pathname").should("eq", "/signin");
    // cy.percySnapshot("Redirect to SignIn");
  });

});