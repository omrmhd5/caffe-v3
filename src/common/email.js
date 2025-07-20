const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const e = require("express");

const sendEmail = async (email, payload) => {
  try {
    let subject = "استعادة كلمة المرور";

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      secureConnection: false,
      port: 587,
      requiresAuth: true,
      domains: ["gmail.com", "googlemail.com"],
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // naturally, replace both with your real credentials or an application-specific password
      },
    });

    const source = fs.readFileSync(path.join(__dirname, "email.hbs"), "utf8");
    const compiledTemplate = handlebars.compile(source);
    const options = () => {
      return {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: subject,
        html: compiledTemplate(payload),
      };
    };

    // Send email
    let emailResult = await transporter.sendMail(options());
    return;
    // transporter.sendMail(options(), (error, info) => {
    //   if (error) {
    //     return error;
    //   } else {
    //     return res.status(200).json({
    //       success: true,
    //     });
    //   }
    // });
  } catch (error) {
    console.log("error>>>>>>>>", error);
    return error;
  }
};


module.exports = sendEmail;
