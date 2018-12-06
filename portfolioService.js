const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const assert = require('assert');

const tableName = process.env.table;

module.exports.createPortfolio = async (event, context) => {
  //console.log(JSON.stringify(event,null,2));

  //console.log(event.body);

  const parsedBody = JSON.parse(event.body);

  console.log(JSON.stringify(parsedBody,null,2));
  //console.log(parsedBody);

  const getUuid = () => uuidv4().replace(/-/g, ''); //the dashes are annoying in URLs. g replaces globally (multiple instances)

  const identifier = getUuid();

  const editSecretToken = getUuid();
  const editSecretTokenHashed = getHashedValue(editSecretToken);

  console.log(identifier);

  //build the new portfolio entry
  const params = {
    Item: {
     "identifier": {S: identifier},
     "editSecretTokenHashed": {S: editSecretTokenHashed},
    },
    TableName: tableName
  };

  await dynamodb.putItem(params).promise();

  console.log("Created shell portfolio in DB")

  //call shared code to update the actual portfolio contents
  await updatePortfolioInDb(identifier, parsedBody);

  return {
    statusCode: 200,
    body: JSON.stringify({
      portfolioIdentifier: identifier,
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

  const identifier = await getIdentifierFromEditTokenIndex(parsedBody.editToken);

  await updatePortfolioInDb(identifier, parsedBody);

  return {
    statusCode: 200,
  };
};

async function getIdentifierFromEditTokenIndex(editToken){
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
  console.log(result.Items[0].identifier);

  return result.Items[0].identifier.S;
}

async function updatePortfolioInDb(identifier, portfolioObjectInput){
  const portfolioObject = {
    coins: portfolioObjectInput.coins,
    name: portfolioObjectInput.name
  }

  assert(typeof portfolioObject.coins == "object");
  assert(typeof portfolioObject.name == "string");

  const params = {
    Key: {
     "identifier": {S: identifier},
    },
    ExpressionAttributeNames: {
      '#portfolioObject': 'portfolioObject'
    },
    ExpressionAttributeValues: {
      ':portfolioObject': { 'S': JSON.stringify(portfolioObject) },
    },
    UpdateExpression: "SET #portfolioObject = :portfolioObject",
    TableName: tableName
  };

  return dynamodb.updateItem(params).promise();
}

module.exports.getPortfolio = async (event, context) => {
  console.log(JSON.stringify(event,null,2));

  return await getPortfolioFromId(event.pathParameters.id);
}

async function getPortfolioFromId(identifier){
  console.log(identifier,null,2);

  const params = {
    Key: {
     "identifier": {
       S: identifier
      },
    },
    TableName: tableName
   };

  const result = await dynamodb.getItem(params).promise();
  console.log(result);

  const portfolioObject = JSON.parse(result.Item.portfolioObject.S);

  return {
    statusCode: 200,
    body: JSON.stringify(portfolioObject)
  };
}

function getHashedValue(value){
  const hash = crypto.createHash('sha256');
  hash.update(value);
  return hash.digest('hex');
}
