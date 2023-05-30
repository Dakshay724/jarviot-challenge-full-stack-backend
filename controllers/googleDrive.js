const Tokens = require("../models/googleDrive");
const { oauth2Client, google, Sequelize } = require("../config/config");

const googleAuth = (req, res) => {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/drive",
      ],
    });
    return res.redirect(url);
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to generate Google Auth URL",
      error: error.message,
    });
  }
};

const googleDrive = async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    await oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const userInfo = await drive.about.get({
      fields: "user",
    });

    const response = await drive.files.list({
      pageSize: 10,
      fields: "files(name, mimeType, size, webContentLink)",
    });

    const files = response.data.files;
    await Tokens.findOne({
      where: {
        email: userInfo.data.user.emailAddress,
      },
    }).then(async function (record) {
      if (record) {
        if (record.access_token !== tokens.access_token) {
          record.access_token = tokens.access_token;
          await record.save();
        } else if (record.access_token === null) {
          record.access_token = tokens.access_token;
          await record.save();
        }
        if (record.refresh_token !== tokens.refresh_token) {
          record.refresh_token = tokens.refresh_token;
          await record.save();
        } else if (record.refresh_token === null) {
          record.refresh_token = tokens.refresh_token;
          await record.save();
        }
      } else {
        Tokens.create({
          name: userInfo.data.user.displayName,
          email: userInfo.data.user.emailAddress,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
      }
    });
    return res.status(200).json({
      status: 200,
      success: true,
      message: "user with its data",
      data: { userInfo, files },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to retrieve data from Google Drive",
      error: error.message,
    });
  }
};

const revokeDriveToken = async (req, res) => {
  try {
    const { access_token, refresh_token } = req.query;
    let tokens;

    if (access_token !== undefined) {
      tokens = await Tokens.findOne({
        where: {
          access_token: access_token,
        },
      });
    } else if (refresh_token !== undefined) {
      tokens = await Tokens.findOne({
        where: {
          refresh_token: refresh_token,
        },
      });
    } else {
      tokens = await Tokens.findOne({
        where: {
          [Sequelize.Op.or]: [
            { access_token: access_token },
            { refresh_token: refresh_token },
          ],
        },
      });
    }

    if (!tokens) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Tokens not found",
        data: "",
      });
    }
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    await Tokens.update(
      {
        access_token: null,
        refresh_token: null,
      },
      {
        where: {
          [Sequelize.Op.or]: [
            { access_token: tokens.access_token },
            { refresh_token: tokens.refresh_token },
          ],
        },
      }
    );

    await oauth2Client.revokeToken(tokens.access_token);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Access has been revoked",
      data: "",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

module.exports = { googleAuth, googleDrive, revokeDriveToken };
