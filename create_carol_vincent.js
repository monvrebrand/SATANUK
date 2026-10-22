const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedCarolVincent() {
  try {
    console.log('🏛️ Initializing Pro-Auditor Seed for Carol Vincent (High Net Worth Current Account)...');

    const firstname = 'Carol';
    const middlename = 'Elizabeth';
    const surname = 'Vincent';
    const email = 'CarolVincent@yahoo.com';
    const username = 'Cvincen';
    const plainPassword = 'Vinismy123@$';
    const phone = '+44 7382929182';
    const dob = '1974-06-14';
    const idNumber = 'UK-PASS-948201948';
    const address = 'Flat 4, 18 Chester Square, Belgravia, London, SW1W 9HS, United Kingdom';
    const accountType = 'Current Account';
    const targetBalance = 8000000.00; // £8,000,000.00
    const transactionCode = '749201836';
    const accountOpenedDate = new Date('2016-03-15T09:30:00.000Z');

    // 1. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // 2. Insert or Update Registration
    let registrationId;
    const checkUser = await db.query(
      'SELECT id FROM registrations WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (checkUser.rows.length > 0) {
      registrationId = checkUser.rows[0].id;
      console.log(`User already exists (ID: ${registrationId}). Updating profile...`);
      await db.query(`
        UPDATE registrations
        SET firstname = $1, middlename = $2, surname = $3, dob = $4, id_number = $5,
            address = $6, email = $7, phone = $8, username = $9, password = $10,
            status = 'approved', account_types = $11, transaction_code = $12,
            created_at = $13
        WHERE id = $14
      `, [
        firstname, middlename, surname, dob, idNumber,
        address, email, phone, username, hashedPassword,
        accountType, transactionCode, accountOpenedDate, registrationId
      ]);
    } else {
      console.log('Creating new registration for Carol Vincent...');
      const regResult = await db.query(`
        INSERT INTO registrations (
          firstname, middlename, surname, dob, id_number,
          address, email, phone, username, password,
          status, account_types, email_notifications, transaction_code, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11, TRUE, $12, $13)
        RETURNING id
      `, [
        firstname, middlename, surname, dob, idNumber,
        address, email, phone, username, hashedPassword,
        accountType, transactionCode, accountOpenedDate
      ]);
      registrationId = regResult.rows[0].id;
    }
    console.log(`✓ Registration ID: ${registrationId}`);

    // 3. Create or Reset Account
    let accountId;
    let accountNumber = '92384192'; // Professional Santander UK 8-digit Account Number

    const checkAcc = await db.query(
      'SELECT id, account_number FROM accounts WHERE registration_id = $1 AND account_type = $2',
      [registrationId, accountType]
    );

    if (checkAcc.rows.length > 0) {
      accountId = checkAcc.rows[0].id;
      accountNumber = checkAcc.rows[0].account_number;
      console.log(`Account exists (ID: ${accountId}, ACC: ${accountNumber}). Purging old transactions...`);
      await db.query('DELETE FROM transactions WHERE account_id = $1', [accountId]);
      await db.query('UPDATE accounts SET balance = $1 WHERE id = $2', [targetBalance, accountId]);
    } else {
      console.log(`Creating new Current Account: ${accountNumber}...`);
      const accResult = await db.query(`
        INSERT INTO accounts (registration_id, account_type, account_number, balance, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [registrationId, accountType, accountNumber, targetBalance, accountOpenedDate]);
      accountId = accResult.rows[0].id;
    }
    console.log(`✓ Account ID: ${accountId}, Account Number: ${accountNumber}`);

    // 4. Generate 10 Years of Realistic Professional Banking Transactions (2016 -> 2026)
    // Curated with high audit integrity, plausible corporate, private equity, property, tax, and dividend flows.
    const rawEvents = [
      // 2016: Account Opening & Initial Liquidity Event
      { date: '2016-03-15T10:00:00Z', type: 'Credit', desc: 'Initial Deposit - Santander Private Wealth Transfer Ref: SPB-7482', amount: 2500000.00 },
      { date: '2016-04-02T14:15:00Z', type: 'Debit',  desc: 'Slaughter and May Solicitors - Legal & Escrow Retainer', amount: 45000.00 },
      { date: '2016-05-18T11:20:00Z', type: 'Credit', desc: 'Vincent Capital Holdings - Quarterly Board Director Remuneration', amount: 75000.00 },
      { date: '2016-06-30T09:00:00Z', type: 'Debit',  desc: 'Cazenove Capital Portfolio Allocation Tranche 1', amount: 500000.00 },
      { date: '2016-08-14T16:45:00Z', type: 'Debit',  desc: 'HMRC Self Assessment Direct Debit - Tax Year 2015/16', amount: 185000.00 },
      { date: '2016-10-10T12:00:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Advisory Retainer Q3', amount: 120000.00 },
      { date: '2016-12-15T15:30:00Z', type: 'Credit', desc: 'UK Treasury Gilt 4.25% Coupon Settlement - CREST 84920', amount: 62500.00 },

      // 2017: Equity Distributions & Real Estate
      { date: '2017-02-20T11:00:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Dividend Distribution FY16', amount: 850000.00 },
      { date: '2017-03-28T13:40:00Z', type: 'Debit',  desc: 'Savills Prime Residential Belgravia - Service Charge & Management', amount: 18450.00 },
      { date: '2017-05-15T10:15:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Advisory Retainer Q1', amount: 120000.00 },
      { date: '2017-07-22T14:30:00Z', type: 'Debit',  desc: 'Herbert Smith Freehills - Commercial Acquisition Advisory', amount: 68500.00 },
      { date: '2017-09-05T09:45:00Z', type: 'Credit', desc: 'Apollo Global Management Secondary Sale Proceeds', amount: 1250000.00 },
      { date: '2017-11-12T16:00:00Z', type: 'Debit',  desc: 'Santander Wealth Management Portfolio Rebalance', amount: 600000.00 },
      { date: '2017-12-20T11:30:00Z', type: 'Credit', desc: 'UK Treasury Gilt Coupon Settlement - CREST 84920', amount: 62500.00 },

      // 2018: Expansion & Private Equity
      { date: '2018-01-31T09:15:00Z', type: 'Debit',  desc: 'HMRC Payments - Capital Gains & Self Assessment', amount: 340000.00 },
      { date: '2018-03-25T15:20:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Annual Dividend FY17', amount: 950000.00 },
      { date: '2018-06-14T12:00:00Z', type: 'Debit',  desc: 'Christies London Fine Art Auction Settlement Ref: LOT-849', amount: 175000.00 },
      { date: '2018-08-19T10:30:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Advisory Retainer Q2', amount: 125000.00 },
      { date: '2018-10-04T14:40:00Z', type: 'Debit',  desc: 'Kensington & Chelsea Royal Borough - Residential Council Tax', amount: 3850.00 },
      { date: '2018-12-18T11:15:00Z', type: 'Credit', desc: 'UK Treasury Gilt Coupon Settlement - CREST 84920', amount: 62500.00 },

      // 2019: Venture Exits & Corporate Dividends
      { date: '2019-02-14T09:30:00Z', type: 'Credit', desc: 'Fintech Series B Partial Exit Proceeds - CHAPS Transfer', amount: 1650000.00 },
      { date: '2019-03-30T16:10:00Z', type: 'Debit',  desc: 'Coutts Private Equity Fund Tranche Subscription', amount: 750000.00 },
      { date: '2019-05-22T11:45:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Dividend FY18', amount: 1100000.00 },
      { date: '2019-07-18T15:00:00Z', type: 'Debit',  desc: 'Slaughter and May - Corporate Restructure Advisory', amount: 52000.00 },
      { date: '2019-09-29T10:20:00Z', type: 'Debit',  desc: 'HMRC Corporate Tax Assessment - Vincent Holdings', amount: 420000.00 },
      { date: '2019-11-15T14:00:00Z', type: 'Credit', desc: 'Barclays Syndicate Bond 5.15% Semi-Annual Yield', amount: 77250.00 },
      { date: '2019-12-20T12:30:00Z', type: 'Debit',  desc: 'Annabel\'s Mayfair & Arts Club Annual Membership Retainers', amount: 12500.00 },

      // 2020: Market Volatility & Liquidity Management
      { date: '2020-03-24T10:00:00Z', type: 'Credit', desc: 'Defensive Equity Reallocation Tranche Liquidation', amount: 1450000.00 },
      { date: '2020-05-12T14:15:00Z', type: 'Debit',  desc: 'Boutique Private Healthcare & Family Medical Retainer', amount: 24000.00 },
      { date: '2020-07-08T11:30:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Interim Dividend 2020', amount: 800000.00 },
      { date: '2020-09-19T16:20:00Z', type: 'Debit',  desc: 'Belgravia Residence Refurbishment - Knight Harwood Contracts', amount: 285000.00 },
      { date: '2020-11-28T09:45:00Z', type: 'Credit', desc: 'Treasury Gilt Redemption - Nominal 2020 Maturity', amount: 1000000.00 },
      { date: '2020-12-15T15:00:00Z', type: 'Debit',  desc: 'Santander UK Wealth Fixed Term Placement Tranche A', amount: 1500000.00 },

      // 2021: Post-Pandemic Rebound & Asset Sales
      { date: '2021-02-18T10:30:00Z', type: 'Credit', desc: 'Commercial Office Asset Disposal - Net Distribution Proceeds', amount: 2200000.00 },
      { date: '2021-04-10T14:00:00Z', type: 'Debit',  desc: 'HMRC Payment - Stamp Duty Land Tax & Capital Gains', amount: 620000.00 },
      { date: '2021-06-25T11:15:00Z', type: 'Credit', desc: 'Vincent Capital Holdings - Final Dividend FY20', amount: 1250000.00 },
      { date: '2021-08-30T13:45:00Z', type: 'Debit',  desc: 'UBS Private Wealth ESG Tranche Allocation', amount: 800000.00 },
      { date: '2021-10-15T09:20:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Annual Consultancy Settlement', amount: 280000.00 },
      { date: '2021-12-22T16:30:00Z', type: 'Debit',  desc: 'The Vincent Foundation - Charitable Endowment Transfer', amount: 150000.00 },

      // 2022: Global Energy & Infrastructure Yields
      { date: '2022-02-10T11:00:00Z', type: 'Credit', desc: 'Octopus Renewables Infrastructure - Dividend Yield', amount: 145000.00 },
      { date: '2022-04-05T15:20:00Z', type: 'Debit',  desc: 'HMRC Self Assessment Payment On Account FY 21/22', amount: 485000.00 },
      { date: '2022-06-18T10:15:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Annual Dividend FY21', amount: 1400000.00 },
      { date: '2022-08-22T14:40:00Z', type: 'Debit',  desc: 'Hiscox Private Client Annual Prestige Underwriting', amount: 16800.00 },
      { date: '2022-10-30T09:50:00Z', type: 'Credit', desc: 'BioTech LP Fund Distribution - CHAPS Ref: BIO-789', amount: 920000.00 },
      { date: '2022-12-19T12:00:00Z', type: 'Debit',  desc: 'Santander Private High-Yield Treasury Bond Allocation', amount: 1200000.00 },

      // 2023: Higher Interest Environment & Directorships
      { date: '2023-01-28T10:45:00Z', type: 'Credit', desc: 'Santander UK 1-Year Fixed Deposit Maturity & Interest', amount: 1565000.00 },
      { date: '2023-03-15T14:30:00Z', type: 'Debit',  desc: 'Deloitte LLP - Private Client Tax & Advisory Audit Fees', amount: 38500.00 },
      { date: '2023-05-20T11:00:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Dividend Distribution FY22', amount: 1350000.00 },
      { date: '2023-07-14T16:15:00Z', type: 'Debit',  desc: 'Harrods Knightsbridge Concierge & Bespoke Travel Settlement', amount: 42600.00 },
      { date: '2023-09-08T09:30:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Non-Executive Director Retainer H1', amount: 160000.00 },
      { date: '2023-11-25T15:40:00Z', type: 'Debit',  desc: 'Mayfair Commercial Property Syndicate Capital Call', amount: 450000.00 },
      { date: '2023-12-20T11:20:00Z', type: 'Credit', desc: 'UK Treasury Gilt 4.5% Coupon Distribution', amount: 90000.00 },

      // 2024: Major Liquidity Event & Private Equity Harvest
      { date: '2024-02-12T10:00:00Z', type: 'Credit', desc: 'TechVentures UK Trade Sale Completion Proceeds - CHAPS Transfer', amount: 2800000.00 },
      { date: '2024-03-29T14:50:00Z', type: 'Debit',  desc: 'HMRC Capital Gains Tax Settlement - Trade Sale', amount: 720000.00 },
      { date: '2024-05-18T11:30:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Dividend FY23', amount: 1500000.00 },
      { date: '2024-07-04T16:00:00Z', type: 'Debit',  desc: 'Slaughter and May Legal Advisory - Offshore Trust Review', amount: 55000.00 },
      { date: '2024-09-15T09:15:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Strategy Consultation Retainer', amount: 180000.00 },
      { date: '2024-11-20T14:20:00Z', type: 'Debit',  desc: 'Santander Private Banking Liquidity Buffer Allocation', amount: 1000000.00 },
      { date: '2024-12-18T11:00:00Z', type: 'Credit', desc: 'Santander Commercial Select Interest Credit Ref: INT-2024-12', amount: 34500.00 },

      // 2025: Institutional Yields & Wealth Restructure
      { date: '2025-01-25T10:30:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Interim Executive Dividend', amount: 950000.00 },
      { date: '2025-03-18T15:10:00Z', type: 'Debit',  desc: 'HMRC Self Assessment Payment FY 24/25 Balancing Charge', amount: 510000.00 },
      { date: '2025-05-14T11:45:00Z', type: 'Credit', desc: 'Crest Dividend Payment - FTSE 100 High-Yield Portfolio', amount: 165000.00 },
      { date: '2025-07-22T14:15:00Z', type: 'Debit',  desc: 'Coutts & Co Private Placement Structured Note Subscription', amount: 850000.00 },
      { date: '2025-09-30T09:40:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Advisory Services Q3', amount: 190000.00 },
      { date: '2025-11-15T16:00:00Z', type: 'Debit',  desc: 'Belgravia Property Estate Insurance & Crown Leasehold Fee', amount: 32500.00 },
      { date: '2025-12-22T12:00:00Z', type: 'Credit', desc: 'Santander Commercial Select Interest Credit Ref: INT-2025-12', amount: 41200.00 },

      // 2026: Recent Active Year (Leading precisely to target balance of £8,000,000.00)
      { date: '2026-01-16T10:00:00Z', type: 'Credit', desc: 'Vincent Capital Holdings - Annual Dividend Distribution FY25', amount: 1750000.00 },
      { date: '2026-02-28T14:20:00Z', type: 'Debit',  desc: 'HMRC Self Assessment Tax Balancing Payment', amount: 580000.00 },
      { date: '2026-04-12T11:10:00Z', type: 'Credit', desc: 'UK Treasury Gilt 4.75% Semi-Annual Maturity Settlement', amount: 475000.00 },
      { date: '2026-06-20T15:30:00Z', type: 'Debit',  desc: 'Slaughter and May - Corporate Regulatory Review 2026', amount: 48500.00 },
      { date: '2026-07-15T09:45:00Z', type: 'Credit', desc: 'Vincent Advisory Ltd - Senior Advisory Retainer Q2', amount: 210000.00 },
      { date: '2026-08-25T14:00:00Z', type: 'Debit',  desc: 'Annabel\'s Mayfair & Royal Automobile Club Annual Fees', amount: 14800.00 },
      { date: '2026-09-18T11:15:00Z', type: 'Credit', desc: 'Santander Private Banking Quarterly Liquidity Yield', amount: 62450.00 },
      { date: '2026-10-05T10:30:00Z', type: 'Debit',  desc: 'Cazenove Capital Management Advisory Settlement Q3', amount: 35000.00 },
      { date: '2026-10-14T15:00:00Z', type: 'Credit', desc: 'Vincent Capital Partners - Interim Executive Dividend Q3', amount: 380000.00 }
    ];

    // Compute net balance of raw events to calculate exact calibration
    let netFromEvents = 0;
    for (const ev of rawEvents) {
      if (ev.type === 'Credit') {
        netFromEvents += ev.amount;
      } else {
        netFromEvents -= ev.amount;
      }
    }
    console.log(`Raw transactions net sum: £${netFromEvents.toFixed(2)}`);

    // We calibrate the final transaction so that runningBalance ends at exactly targetBalance (£8,000,000.00)
    const calibrationDifference = targetBalance - netFromEvents;
    console.log(`Calibration required for exact £8,000,000.00 target: £${calibrationDifference.toFixed(2)}`);

    // Add calibration transaction in mid-October 2026
    if (calibrationDifference > 0) {
      rawEvents.push({
        date: '2026-10-20T11:45:00Z',
        type: 'Credit',
        desc: 'Vincent Holdings UK - Special Capital Dividend & Liquidity Reconciliation',
        amount: parseFloat(calibrationDifference.toFixed(2))
      });
    } else if (calibrationDifference < 0) {
      rawEvents.push({
        date: '2026-10-20T11:45:00Z',
        type: 'Debit',
        desc: 'Santander Wealth Liquidity Reinvestment - Sterling Cash Reserve Fund',
        amount: parseFloat(Math.abs(calibrationDifference).toFixed(2))
      });
    }

    // Now insert all transactions chronologically with audited balance_after
    let runningBalance = 0;
    console.log(`\nInserting ${rawEvents.length} chronological audit-verified transactions...`);

    for (let i = 0; i < rawEvents.length; i++) {
      const tx = rawEvents[i];
      if (tx.type === 'Credit') {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }

      await db.query(`
        INSERT INTO transactions (account_id, transaction_type, amount, description, balance_after, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [accountId, tx.type, tx.amount, tx.desc, runningBalance, tx.date]);
    }

    console.log(`Final transaction balance_after: £${runningBalance.toFixed(2)}`);
    console.log(`Target balance: £${targetBalance.toFixed(2)}`);

    // Verify account balance matches runningBalance exactly
    await db.query('UPDATE accounts SET balance = $1 WHERE id = $2', [runningBalance, accountId]);

    // 5. Seed Welcome & Financial Notifications for Carol Vincent
    console.log('\nGenerating Santander Private Client in-app notifications...');
    await db.query('DELETE FROM notifications WHERE username = $1', [username]);

    const notifications = [
      {
        message: 'Welcome to Santander Select & Private Banking. Your dedicated relationship manager is Lord Alistair Montgomery.',
        type: 'welcome',
        date: '2016-03-15T10:05:00Z'
      },
      {
        message: 'Annual Statement for FY 2024/2025 has been prepared and archived to your secure portal.',
        type: 'statement',
        date: '2025-04-06T09:00:00Z'
      },
      {
        message: 'Security Notice: Two-Factor Authentication confirmed for new biometric access.',
        type: 'security',
        date: '2026-09-01T14:20:00Z'
      },
      {
        message: 'Transaction Alert: Inbound transfer of £380,000.00 from Vincent Capital Partners credited to Current Account 92384192.',
        type: 'credit',
        date: '2026-10-14T15:02:00Z'
      },
      {
        message: 'Portfolio Alert: Available liquidity balance in Current Account 92384192 stands at £8,000,000.00.',
        type: 'alert',
        date: '2026-10-20T12:00:00Z'
      }
    ];

    for (const n of notifications) {
      await db.query(`
        INSERT INTO notifications (username, message, type, is_read, created_at)
        VALUES ($1, $2, $3, FALSE, $4)
      `, [username, n.message, n.type, n.date]);
    }

    console.log('✓ Notifications created.');
    console.log('\n======================================================');
    console.log('✅ VIP USER PROFILE CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`Name:              ${firstname} ${surname}`);
    console.log(`Username:          ${username}`);
    console.log(`Password:          ${plainPassword}`);
    console.log(`Email:             ${email}`);
    console.log(`Phone:             ${phone}`);
    console.log(`Address:           ${address}`);
    console.log(`Account Type:      ${accountType}`);
    console.log(`Account Number:    ${accountNumber}`);
    console.log(`Available Balance: £${runningBalance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`Account Opened:    March 15, 2016 (10 Years Active History)`);
    console.log(`Total Audited Tx:  ${rawEvents.length} transactions across 2016 - 2026`);
    console.log('======================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating Carol Vincent profile:', err);
    process.exit(1);
  }
}

seedCarolVincent();
