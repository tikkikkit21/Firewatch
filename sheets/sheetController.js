const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

module.exports.test = async function () {
    const auth = new GoogleAuth({
        keyFile: "credentials.json",
        scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const service = google.sheets({ version: 'v4', auth });
    try {
        const result = await service.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: "A1:G10"
        });
        const numRows = result.data.values ? result.data.values.length : 0;
        console.log(result.data);
        return result;
    } catch (err) {
        // TODO (developer) - Handle exception
        throw err;
    }
}
