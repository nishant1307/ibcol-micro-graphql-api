const { json, send } = require('micro');

const mailchimpTestHandler = async (req, res) => {
  const Mailchimp = require('mailchimp-api-v3')

  const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);


  // const data = await json(req);
  // // console.log(data);

  // if (data.listId === undefined)
  //   send(res, 500, 'missing list id');

  // const result = await mailchimp.post(
  //   `/lists/${data.listId}`, {
  //     members: [
  //       {
  //         email_address: data.email,
  //         status: 'subscribed',
  //       }
  //     ],
  //     update_existing: true
  //   }).catch((error) => {
  //     send(res, error.status, Object.assign({}, error, { status: 'error' }));
  //   });

  // // console.log('result', result);


  // if (result.errors.length > 0) {
  //   send(res, 400, { status: 'error', errors: result.errors });
  // } else {
  //   send(res, 200, { status: 'successful', result });
  // }




  const result = await  mailchimp.get({
    path: '/lists'
  }).catch((error) => {
    send(res, error.status, Object.assign({}, error, { status: 'error' }));
  });
  
  send(res, 200, { status: 'successful', result });
  
  
  
  
}


module.exports = mailchimpTestHandler;