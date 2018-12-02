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
       S: parsedBody.name
      },
      "name": {
        S: parsedBody.name
       },
     "coins": {
       S: JSON.stringify(parsedBody.coins)
      }
    },
    TableName: process.env.table
  };

  await dynamo.putItem(params).promise();

  return {
    statusCode: 200,
  };

};
