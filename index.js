require('dotenv').config();

const express = require('express');
const app = express();

const path = require('path');
const util = require('util');

const PORT = process.env.PORT || 3000;
const WEBHOOK = 'https://testwebhook.com/';
let INCOME_VERIFICATION_ID;

const plaid = require('plaid');
const plaidClient = new plaid.Client({
    clientID: process.env.CLIENT_ID,
    secret: process.env.SECRET,
    env: plaid.environments.sandbox,
});

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/create-link-token', async (req, res) => {
    const { income_verification_id: incomeVerificationId } = await plaidClient.createIncomeVerification(WEBHOOK);
    INCOME_VERIFICATION_ID = incomeVerificationId;

    const { link_token: linkToken } = await plaidClient.createLinkToken({
        user: {
            client_user_id: 'some-cool-user-id',
        },
        client_name: 'App of Tyler',
        products: ['income_verification'],
        country_codes: ['US'],
        language: 'en',
        income_verification: {
            income_verification_id: INCOME_VERIFICATION_ID,
        },
    });

    res.json({ linkToken });
});

app.get('/retrieve-income', async (req, res) => {
    const incomeSummary = await plaidClient.getSummary(INCOME_VERIFICATION_ID);
    console.log('-----------------');
    console.log('Income summary: ');
    console.log(util.inspect(incomeSummary, false, null, true));

    const paystubSummary = await plaidClient.getPaystub(INCOME_VERIFICATION_ID);
    console.log('-----------------');
    console.log('Paystub summary: ');
    console.log(paystubSummary);

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log('listening on port', PORT);
});
