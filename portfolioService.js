const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB({apiVersion: '2012-08-10'});

module.exports.createPortfolio = async (event, context) => {

  //console.log(JSON.stringify(event,null,2));

  //console.log(event.body);

  const parsedBody = JSON.parse(event.body);

  console.log(JSON.stringify(parsedBody,null,2));
  //console.log(parsedBody);


  var params = {
    Item: {
     "identifierHash": {
       S: "as7df809asd7f9a0s"
      },
     "coins": {
       S: "test"
      }
    },
    TableName: process.env.table
  };

  await dynamodb.putItem(params).Promise();

  return {
    statusCode: 200,
  };

};
