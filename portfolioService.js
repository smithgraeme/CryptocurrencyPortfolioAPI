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

  const getUuid = () => uuidv4().replace(/-/g, ''); //the dashes are annoying in URLs. g replaces globally (multiple instances)

  const portfolioId = getUuid();
  const portfolioIdHashed = getHashedValue(portfolioId);

  const editSecretToken = getUuid();
  const editSecretTokenHashed = getHashedValue(editSecretToken);

  console.log(portfolioId);

  const params = {
    Item: {
     "identifierHash": {S: portfolioIdHashed},
     "editSecretTokenHashed": {S: editSecretTokenHashed},
     "name": {S: parsedBody.name},
     "coins": {S: JSON.stringify(parsedBody.coins)}
    },
    TableName: tableName
  };

  await dynamodb.putItem(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      portfolioIdentifier: portfolioId,
      editSecretToken: editSecretToken
    })
  };
};

module.exports.editPortfolio = async (event, context) => {
  //console.log(JSON.stringify(event,null,2));

  //console.log(event.body);

  const parsedBody = JSON.parse(event.body);

  console.log(JSON.stringify(parsedBody,null,2));
  //console.log(parsedBody);

  const identifierHash = await getPrimaryKeyFromEditTokenIndex(parsedBody.editToken);

  const params = {
    Key: {
     "identifierHash": identifierHash,
    },
    ExpressionAttributeNames: { '#coins': 'coins' },
    ExpressionAttributeValues: { ':coins': { 'S': JSON.stringify(parsedBody.coins) }},
    UpdateExpression: "SET #coins = :coins",
    TableName: tableName
  };

  await dynamodb.updateItem(params).promise();

  return {
    statusCode: 200,
    // body: JSON.stringify({
    // })
  };
};

async function getPrimaryKeyFromEditTokenIndex(editToken){
  const params = {
    KeyConditionExpression: "#editSecretTokenHashed = :editToken",
    ExpressionAttributeNames: { '#editSecretTokenHashed': 'editSecretTokenHashed' },
    ExpressionAttributeValues: { ':editToken': { 'S': getHashedValue(editToken) }},
    TableName: tableName,
    IndexName: "EditToken"
   };

  const result = await dynamodb.query(params).promise();

  console.log(result);
  console.log(result.Items[0]);
  console.log(result.Items[0].identifierHash);

  return result.Items[0].identifierHash;
}

module.exports.getPortfolio = async (event, context) => {
  console.log(JSON.stringify(event,null,2));

  return await getPortfolioFromId(event.pathParameters.id);
}

async function getPortfolioFromId(portfolioId){
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
      coins: coins,
    })
  };
}

function getHashedValue(value){
  const hash = crypto.createHash('sha256');
  hash.update(value);
  return hash.digest('hex');
}
