const nodemailer = require("nodemailer");
require("dotenv").config();

//sent otp by email
   //1 create email transporter
   const transporter = nodemailer.createTransport({
    pool: true,
    host: process.env.SMTP_HOST,
    // port: process.env.SMTP_PORT,
    // service : 'gmail',
    auth : {
        user : process.env.SMTP_MAIL ,
        pass : process.env.SMTP_PASSWORD
    },
    secure: false, // Use TLS but don't verify certificates
    tls: {
    rejectUnauthorized: false // Don't fail on invalid certs
}
    // authMethod: 'LOGIN', // Explicitly set the authentication method
})

const sendOTPByEmail = (email,otp,fullName) => {
    try{
 
    //2.configure email content
    const mailOptions ={
        from :process.env.SMTP_MAIL,
        to   :  email,
        subject :  "OTP Verification",
        // text : `Your OTP for email verification is: ${otp}`,
        html:`<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
        <table role="presentation"
          style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
          <tbody>
            <tr>
              <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
                <table role="presentation" style="max-width: 300px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
                  <tbody>
                    <tr>
                      <td style="padding: 20px 0px 0px;">
                        <div style="text-align: center;">
                          <div style="padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                            <div class="header" style="text-align: center; margin-bottom: 5px;">
                              <img src="https://mabo.mammoth.al:9000/uploads/app_logo/MB_logo.png" alt="App Logo" style="width: 50px; height: auto;">
                            </div>
                            <h2 style="color: #333; margin-top: 20;margin-bottom: 15; text-align: center;">Email Verification</h2>
                            <p style="color: #666; line-height: 1;">Dear, ${fullName}</p>
                            <p style="color: #666; line-height: 1;">Your verification code is: <span class="otp-code" style="font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 20px;">${otp}</span></p>
                            <p style="color: #666; line-height: 1;">Please use this code to verify your email address.</p>
                            <div class="footer" style="margin-top: 20px; color: #999; font-size: 12px; text-align: center;">
                              <p>This email was sent automatically. Please do not reply.</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>`,
    }

    //3.send email
   transporter.sendMail(mailOptions, (error,info)=>{
    if(error) {
        console.error("Error sending emailxx:", error);
    }else{
        console.log("Email sent:", info.response);
    }
  });
}catch(error){
    console.error("Error sending email!(try catch block):", error);
    throw error; // rethrow the error to be caught in the calling function
}
};


const sendContactUsEmail = (userDetails) => {
  try{

  //2.configure email content
  const mailOptions ={
      from :process.env.SMTP_MAIL,
      to   : userDetails.email,
      subject :  "Contact US",
      // text : `Your OTP for email verification is: ${otp}`,
      html:`<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
      <table role="presentation"
        style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
        <tbody>
          <tr>
            <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
              <table role="presentation" style="max-width: 300px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
                <tbody>
                  <tr>
                    <td style="padding: 20px 0px 0px;">
                      <div style="text-align: center;">
                        <div style="padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                          <div class="header" style="text-align: center; margin-bottom: 5px;">
                            <img src="https://mabo.mammoth.al:9000/uploads/app_logo/MB_logo.png" alt="App Logo" style="width: 50px; height: auto;">
                          </div>
                          <h2 style="color: #333; margin-top: 20;margin-bottom: 15; text-align: center;">Contact US</h2>
                          <p style="color: #666; line-height: 1.5;text-align:  justify;">Thank you for reaching out to us. We value your input and will respond to your inquiry as soon as possible.</p>
                          <div class="footer" style="margin-top: 20px; color: #999; font-size: 12px; text-align: center;">
                            <p>This email was sent automatically. Please do not reply.</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>`,
  }
  const mailOptions2 ={
    from :process.env.SMTP_MAIL,
    to   : "contact_mabo@mammoth.al",
    // to:"kirtanwyn@gmail.com",
    subject :  "Contact US",
    // text : `Your OTP for email verification is: ${otp}`,
    html:`<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
    <table role="presentation"
      style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
      <tbody>
        <tr>
          <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
            <table role="presentation" style="max-width: 300px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
              <tbody>
                <tr>
                  <td style="padding: 20px 0px 0px;">
                    <div style="text-align: left;">
                      <div style="padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <div class="header" style="text-align: center; margin-bottom: 5px;">
                          <img src="https://mabo.mammoth.al:9000/uploads/app_logo/MB_logo.png" alt="App Logo" style="width: 50px; height: auto;">
                        </div>
                        <h2 style="color: #333; margin-top: 20;margin-bottom: 15; text-align: center;">Contact US</h2>
                        <p style="color: #666; line-height: 1;">Subject : ${userDetails.subjects}</p>
                        <p style="color: #666; line-height: 20px;">Message : ${userDetails.message}</p>
                        <p style="color: #666; line-height: 1;">Name : ${userDetails.fullName}</p>
                        <p style="color: #666; line-height: 1;">Email : ${userDetails.email}</p>
                        <p style="color: #666; line-height: 1;">Role : ${userDetails.role}</p>
                        <div class="footer" style="margin-top: 20px; color: #999; font-size: 12px; text-align: center;">
                          <p>This email was sent automatically. Please do not reply.</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>`,
}
  //3.send email
 transporter.sendMail(mailOptions, (error,info)=>{
  if(error) {
      console.error("Error sending emailxx:", error);
  }else{
      console.log("Email sent:", info.response);
  }
  
});
transporter.sendMail(mailOptions2, (error,info)=>{
  if(error) {
      console.error("Error sending emailxx:", error);
  }else{
      console.log("Email sent:", info.response);
  }
  
});
}catch(error){
  console.error("Error sending email!(try catch block):", error);
  throw error; // rethrow the error to be caught in the calling function
}
};
module.exports = { sendOTPByEmail ,sendContactUsEmail} 