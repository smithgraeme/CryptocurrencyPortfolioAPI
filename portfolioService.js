const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');

const tableName = process.env.table;

module.exports.createPortfolio = async (event, context) => {
  //console.log(JSON.stringify(event,null,2));

  //console.log(event.body);

  const parsedBody = JSON.parse(event.body);

  console.log(JSON.stringify(parsedBody,null,2));
  //console.log(parsedBody);

  const uuid = uuidv4().replace(/-/g, ''); //the dashes are annoying in URLs
  const hashedUuid = getHashedValue(uuid);

  console.log(uuid);

  const params = {
    Item: {
     "identifierHash": {
       S: hashedUuid
      },
      "name": {
        S: parsedBody.name
       },
     "coins": {
       S: JSON.stringify(parsedBody.coins)
      }
    },
    TableName: tableName
  };

  await dynamodb.putItem(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      portfolioIdentifier: uuid,
      //hashedUuid: hashedUuid
    })
  };
};

module.exports.getPortfolio = async (event, context) => {
  console.log(JSON.stringify(event,null,2));

  var portfolioId;

  //support loading the portfolio ID as both a query parameter or a path parameter
  //if one fails, just try the other
  try{
    portfolioId = event.queryStringParameters.portfolioId
  } catch(error) {
    portfolioId = event.pathParameters.id;
  }

  console.log(portfolioId,null,2);

  const portfolioIdHashed = getHashedValue(portfolioId);

  const params = {
    Key: {
     "identifierHash": {
       S: portfolioIdHashed
      },
    },
    TableName: tableName
   };

  const result = await dynamodb.getItem(params).promise();
  console.log(result);

  const coins = JSON.parse(result.Item.coins.S);

  return {
    statusCode: 200,
    body: JSON.stringify({
      coins: coins
    })
  };
}

function getHashedValue(value){
  const hash = crypto.createHash('sha256');
  hash.update(value);
  return hash.digest('hex');
}
